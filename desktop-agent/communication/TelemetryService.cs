using System.Management;
using LibreHardwareMonitor.Hardware;
using DesktopAgent.Core;
using DesktopAgent.Models;

namespace DesktopAgent.Communication;

public class TelemetryService : IDisposable
{
    private readonly PeripheralMonitor _peripheralMonitor;
    private readonly SocketIOAgentClient _socketClient;
    private readonly string _agentId;
    private readonly Computer _computer;
    private readonly AgentStateService _stateService;

    public TelemetryService(
        SocketIOAgentClient socketClient,
        string agentId,
        AgentStateService stateService)
    {
        _socketClient = socketClient;
        
        // Default to local machine name if agentId is missing
        _agentId = string.IsNullOrWhiteSpace(agentId) 
            ? Environment.MachineName 
            : agentId;
            
        _stateService = stateService;

        _peripheralMonitor = new PeripheralMonitor();

        // Initialize LibreHardwareMonitor hardware detectors
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

    public async Task StartAsync(CancellationToken cancellationToken)
{
    Console.WriteLine("📡 [TELEMETRY] Telemetry loop started.");

    while (!cancellationToken.IsCancellationRequested)
    {
        if (_socketClient.IsConnected)
        {
            try
            {
                AgentStatus status = CollectStatus();

                Console.WriteLine($"📡 [TELEMETRY] Emitting stats for station [{_agentId}]: CPU {status.CpuUsage}%, RAM {status.MemoryUsage}%");

                await _socketClient.EmitAsync("TELEMETRY", new
                {
                    stationId = _agentId,
                    cpuUsage = status.CpuUsage,
                    memoryUsage = status.MemoryUsage,
                    cpuTemperature = status.CpuTemperature,
                    gpuUsage = status.GpuUsage,
                    gpuTemperature = status.GpuTemperature,
                    fanSpeed = status.FanSpeed,
                    isLocked = status.IsLocked,
                    inSession = status.InSession,
                    sessionId = status.SessionId
                });

                PeripheralChange? change = _peripheralMonitor.Check();
                if (change != null)
                {
                    await SendPeripheralAlertAsync(change);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ [TELEMETRY ERROR] {ex.Message}");
            }
        }
        else
        {
            Console.WriteLine("⚠️ [TELEMETRY] Socket not connected yet. Waiting...");
        }

        try
        {
            await Task.Delay(TimeSpan.FromSeconds(5), cancellationToken);
        }
        catch (OperationCanceledException)
        {
            break;
        }
    }
}

    private AgentStatus CollectStatus()
    {
        AgentStatus status = new AgentStatus
        {
            AgentId = _agentId,
            IsOnline = true,
            MachineName = Environment.MachineName,

            CpuUsage = 0,
            MemoryUsage = 0,

            CpuTemperature = null,
            GpuUsage = null,
            GpuTemperature = null,
            FanSpeed = null,

            KeyboardConnected = false,
            MouseConnected = false,

            IsLocked = _stateService.IsLocked,
            InSession = _stateService.InSession,
            SessionId = _stateService.SessionId,

            Peripherals = new List<string>()
        };

        // Query LibreHardwareMonitor sensors dynamically
        foreach (IHardware hardware in _computer.Hardware)
        {
            hardware.Update();

            foreach (ISensor sensor in hardware.Sensors)
            {
                if (sensor.Value == null) continue;

                float value = sensor.Value.Value;

                if (sensor.SensorType == SensorType.Load)
                {
                    if (hardware.HardwareType == HardwareType.Cpu &&
                        sensor.Name.Contains("CPU Total", StringComparison.OrdinalIgnoreCase))
                    {
                        status.CpuUsage = Math.Round(value, 1);
                    }

                    if (hardware.HardwareType == HardwareType.GpuNvidia ||
                        hardware.HardwareType == HardwareType.GpuAmd ||
                        hardware.HardwareType == HardwareType.GpuIntel)
                    {
                        status.GpuUsage = Math.Round(value, 1);
                    }
                }

                if (sensor.SensorType == SensorType.Temperature)
                {
                    if (hardware.HardwareType == HardwareType.Cpu &&
                        (sensor.Name.Contains("Package", StringComparison.OrdinalIgnoreCase) ||
                         sensor.Name.Contains("CPU", StringComparison.OrdinalIgnoreCase)))
                    {
                        status.CpuTemperature = Math.Round(value, 1);
                    }

                    if (hardware.HardwareType == HardwareType.GpuNvidia ||
                        hardware.HardwareType == HardwareType.GpuAmd ||
                        hardware.HardwareType == HardwareType.GpuIntel)
                    {
                        status.GpuTemperature = Math.Round(value, 1);
                    }
                }

                if (sensor.SensorType == SensorType.Fan && status.FanSpeed == null)
                {
                    status.FanSpeed = Math.Round(value, 1);
                }
            }
        }

        status.MemoryUsage = Math.Round(GetMemoryUsage(), 1);
        UpdatePeripheralStatus(status);

        return status;
    }

    private double GetMemoryUsage()
    {
        try
        {
            using ManagementObjectSearcher searcher = new ManagementObjectSearcher(
                "SELECT TotalVisibleMemorySize, FreePhysicalMemory FROM Win32_OperatingSystem"
            );

            foreach (ManagementObject obj in searcher.Get())
            {
                double total = Convert.ToDouble(obj["TotalVisibleMemorySize"]);
                double free = Convert.ToDouble(obj["FreePhysicalMemory"]);

                if (total <= 0) return 0;
                return ((total - free) / total) * 100;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Memory detection error: {ex.Message}");
        }

        return 0;
    }

    private void UpdatePeripheralStatus(AgentStatus status)
    {
        status.KeyboardConnected = false;
        status.MouseConnected = false;
        status.Peripherals.Clear();

        try
        {
            using ManagementObjectSearcher searcher = new ManagementObjectSearcher(
                "SELECT Name, PNPClass FROM Win32_PnPEntity WHERE ConfigManagerErrorCode = 0"
            );

            foreach (ManagementObject obj in searcher.Get())
            {
                string? name = obj["Name"]?.ToString();
                string? pnpClass = obj["PNPClass"]?.ToString();

                if (string.IsNullOrWhiteSpace(name)) continue;

                status.Peripherals.Add(name);

                if (pnpClass == "Keyboard" || name.Contains("keyboard", StringComparison.OrdinalIgnoreCase))
                {
                    status.KeyboardConnected = true;
                }

                if (pnpClass == "Mouse" || name.Contains("mouse", StringComparison.OrdinalIgnoreCase))
                {
                    status.MouseConnected = true;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Peripheral detection error: {ex.Message}");
        }
    }

    private async Task SendPeripheralAlertAsync(PeripheralChange change)
    {
        // Emit Socket.IO 'SECURITY_EVENT' to backend
        await _socketClient.SendSecurityEventAsync(
            _agentId,
            $"{change.Device}_disconnected",
            "WARNING",
            $"{change.Device} disconnected"
        );
    }

    public void Dispose()
    {
        _computer.Close();
    }
}