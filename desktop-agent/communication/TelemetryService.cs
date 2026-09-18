using System.Management;
using System.Text.Json;
using LibreHardwareMonitor.Hardware;
using DesktopAgent.Core;
using DesktopAgent.Models;

namespace DesktopAgent.Communication;

public class TelemetryService
{
    private readonly PeripheralMonitor _peripheralMonitor;
    private readonly WebSocketClient _webSocketClient;
    private readonly string _agentId;
    private readonly Computer _computer;
    private readonly AgentStateService _stateService;

    public TelemetryService(
        WebSocketClient webSocketClient,
        string agentId,
        AgentStateService stateService)
    {
        _webSocketClient = webSocketClient;
        _agentId = agentId;
        _stateService = stateService;

        _peripheralMonitor =
            new PeripheralMonitor();

        _computer = new Computer
        {
            IsCpuEnabled = true,
            IsGpuEnabled = true,
            IsMemoryEnabled = true,
            IsMotherboardEnabled = true,
            IsControllerEnabled = true
        };

        _computer.Open();
    }

    public async Task StartAsync(
        CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            if (_webSocketClient.IsConnected)
            {
                try
                {
                    AgentStatus status =
                        CollectStatus();

                    AgentMessage message =
                        new AgentMessage
                        {
                            Type = "telemetry",
                            AgentId = _agentId,
                            Data = status
                        };

                    string json =
                        JsonSerializer.Serialize(
                            message
                        );

                    await _webSocketClient.SendAsync(
                        json
                    );

                    PeripheralChange? change =
                        _peripheralMonitor.Check();

                    if (change != null)
                    {
                        await SendPeripheralAlertAsync(
                            change
                        );
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine(
                        $"Telemetry error: {ex.Message}"
                    );
                }
            }

            try
            {
                await Task.Delay(
                    TimeSpan.FromSeconds(5),
                    cancellationToken
                );
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }

    private AgentStatus CollectStatus()
    {
        AgentStatus status =
            new AgentStatus
            {
                AgentId = _agentId,
                IsOnline = true,
                MachineName =
                    Environment.MachineName,

                CpuUsage = 0,
                MemoryUsage = 0,

                CpuTemperature = null,
                GpuUsage = null,
                GpuTemperature = null,
                FanSpeed = null,

                KeyboardConnected = false,
                MouseConnected = false,

                IsLocked =
                    _stateService.IsLocked,

                InSession =
                    _stateService.InSession,

                SessionId =
                    _stateService.SessionId,

                Peripherals =
                    new List<string>()
            };

        foreach (IHardware hardware
                 in _computer.Hardware)
        {
            hardware.Update();

            foreach (ISensor sensor
                     in hardware.Sensors)
            {
                if (sensor.Value == null)
                {
                    continue;
                }

                float value =
                    sensor.Value.Value;

                if (sensor.SensorType ==
                    SensorType.Load)
                {
                    if (
                        hardware.HardwareType ==
                            HardwareType.Cpu &&
                        sensor.Name.Contains(
                            "CPU Total",
                            StringComparison.OrdinalIgnoreCase)
                    )
                    {
                        status.CpuUsage =
                            value;
                    }

                    if (
                        hardware.HardwareType ==
                            HardwareType.GpuNvidia ||
                        hardware.HardwareType ==
                            HardwareType.GpuAmd ||
                        hardware.HardwareType ==
                            HardwareType.GpuIntel
                    )
                    {
                        status.GpuUsage =
                            value;
                    }
                }

                if (sensor.SensorType ==
                    SensorType.Temperature)
                {
                    if (
                        hardware.HardwareType ==
                            HardwareType.Cpu &&
                        (
                            sensor.Name.Contains(
                                "Package",
                                StringComparison.OrdinalIgnoreCase) ||
                            sensor.Name.Contains(
                                "CPU",
                                StringComparison.OrdinalIgnoreCase)
                        )
                    )
                    {
                        status.CpuTemperature =
                            value;
                    }

                    if (
                        hardware.HardwareType ==
                            HardwareType.GpuNvidia ||
                        hardware.HardwareType ==
                            HardwareType.GpuAmd ||
                        hardware.HardwareType ==
                            HardwareType.GpuIntel
                    )
                    {
                        status.GpuTemperature =
                            value;
                    }
                }

                if (sensor.SensorType ==
                    SensorType.Fan)
                {
                    if (status.FanSpeed == null)
                    {
                        status.FanSpeed =
                            value;
                    }
                }
            }
        }

        status.MemoryUsage =
            GetMemoryUsage();

        UpdatePeripheralStatus(status);

        return status;
    }

    private double GetMemoryUsage()
    {
        try
        {
            using ManagementObjectSearcher searcher =
                new ManagementObjectSearcher(
                    "SELECT TotalVisibleMemorySize, FreePhysicalMemory " +
                    "FROM Win32_OperatingSystem"
                );

            foreach (ManagementObject obj
                     in searcher.Get())
            {
                double total =
                    Convert.ToDouble(
                        obj["TotalVisibleMemorySize"]
                    );

                double free =
                    Convert.ToDouble(
                        obj["FreePhysicalMemory"]
                    );

                if (total <= 0)
                {
                    return 0;
                }

                return
                    ((total - free) / total) * 100;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"Memory detection error: {ex.Message}"
            );
        }

        return 0;
    }

    private void UpdatePeripheralStatus(
        AgentStatus status)
    {
        status.KeyboardConnected = false;
        status.MouseConnected = false;

        status.Peripherals.Clear();

        try
        {
            using ManagementObjectSearcher searcher =
                new ManagementObjectSearcher(
                    "SELECT Name, PNPClass " +
                    "FROM Win32_PnPEntity " +
                    "WHERE ConfigManagerErrorCode = 0"
                );

            foreach (ManagementObject obj
                     in searcher.Get())
            {
                string? name =
                    obj["Name"]?.ToString();

                string? pnpClass =
                    obj["PNPClass"]?.ToString();

                if (string.IsNullOrWhiteSpace(name))
                {
                    continue;
                }

                status.Peripherals.Add(name);

                if (
                    pnpClass == "Keyboard" ||
                    name.Contains(
                        "keyboard",
                        StringComparison.OrdinalIgnoreCase)
                )
                {
                    status.KeyboardConnected = true;
                }

                if (
                    pnpClass == "Mouse" ||
                    name.Contains(
                        "mouse",
                        StringComparison.OrdinalIgnoreCase)
                )
                {
                    status.MouseConnected = true;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"Peripheral detection error: {ex.Message}"
            );
        }
    }

    private async Task SendPeripheralAlertAsync(
        PeripheralChange change)
    {
        AgentMessage message =
            new AgentMessage
            {
                Type = "security_event",
                AgentId = _agentId,
                Event =
                    $"{change.Device}_disconnected",
                Severity = "warning",
                Message =
                    $"{change.Device} disconnected"
            };

        string json =
            JsonSerializer.Serialize(message);

        await _webSocketClient.SendAsync(json);
    }

    public void Dispose()
    {
        _computer.Close();
    }
}