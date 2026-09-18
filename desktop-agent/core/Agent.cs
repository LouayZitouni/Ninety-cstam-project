using System.Text.Json;
using DesktopAgent.Communication;

namespace DesktopAgent.Core;

public class Agent
{
    private readonly AgentConfig _config;
    private readonly string _agentId;

    private readonly AgentStateService _stateService;

    private readonly WebSocketClient _webSocketClient;
    private readonly MessageHandler _messageHandler;
    private readonly HeartbeatService _heartbeatService;
    private readonly TelemetryService _telemetryService;

    private readonly CancellationTokenSource
        _cancellationTokenSource;

    public Agent(
        AgentConfig config,
        string agentId)
    {
        _config = config;
        _agentId = agentId;

        _stateService =
            new AgentStateService();

        _webSocketClient =
            new WebSocketClient();

        _messageHandler =
            new MessageHandler(
                _stateService
            );

        _heartbeatService =
            new HeartbeatService(
                _webSocketClient,
                _agentId
            );

        _telemetryService =
            new TelemetryService(
                _webSocketClient,
                _agentId,
                _stateService
            );

        _cancellationTokenSource =
            new CancellationTokenSource();
    }

    public async Task StartAsync()
    {
        Console.WriteLine(
            "================================"
        );

        Console.WriteLine(
            "NINETY Desktop Agent"
        );

        Console.WriteLine(
            "================================"
        );

        Console.WriteLine(
            $"Agent ID: {_agentId}"
        );

        Console.WriteLine(
            $"Machine: {Environment.MachineName}"
        );

        _ = _heartbeatService.StartAsync(
            _cancellationTokenSource.Token
        );

        _ = _telemetryService.StartAsync(
            _cancellationTokenSource.Token
        );

        while (
            !_cancellationTokenSource
                .Token
                .IsCancellationRequested)
        {
            try
            {
                await _webSocketClient.ConnectAsync(
                    _config.ServerUrl
                );

                await RegisterAsync();

                await ListenAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"Connection error: {ex.Message}"
                );
            }

            if (
                _cancellationTokenSource
                    .Token
                    .IsCancellationRequested)
            {
                break;
            }

            Console.WriteLine(
                "Connection lost."
            );

            Console.WriteLine(
                "Reconnecting in 5 seconds..."
            );

            try
            {
                await Task.Delay(
                    TimeSpan.FromSeconds(5),
                    _cancellationTokenSource.Token
                );
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        await _webSocketClient.DisconnectAsync();

        _telemetryService.Dispose();

        Console.WriteLine(
            "Desktop Agent stopped."
        );
    }

    private async Task RegisterAsync()
    {
        AgentMessage registration =
            new AgentMessage
            {
                Type = "register",

                AgentId = _agentId,

                Message =
                    "Desktop agent connected",

                Data = new
                {
                    machineName =
                        Environment.MachineName,

                    operatingSystem =
                        Environment.OSVersion.ToString(),

                    processorCount =
                        Environment.ProcessorCount
                }
            };

        string json =
            JsonSerializer.Serialize(
                registration
            );

        await _webSocketClient.SendAsync(
            json
        );

        Console.WriteLine(
            "Agent registered with server."
        );
    }

    private async Task ListenAsync()
    {
        while (_webSocketClient.IsConnected)
        {
            string? message =
                await _webSocketClient.ReceiveAsync();

            if (message == null)
            {
                break;
            }

            Console.WriteLine(
                $"Received: {message}"
            );

            AgentMessage? received;

            try
            {
                received =
                    JsonSerializer.Deserialize<AgentMessage>(
                        message,
                        new JsonSerializerOptions
                        {
                            PropertyNameCaseInsensitive = true
                        }
                    );
            }
            catch
            {
                Console.WriteLine(
                    "Invalid message from server."
                );

                continue;
            }

            if (received == null)
            {
                continue;
            }

            bool success =
                _messageHandler.Handle(
                    message,
                    _agentId
                );

            if (received.Type.Equals(
                    "command",
                    StringComparison.OrdinalIgnoreCase))
            {
                AgentMessage result =
                    new AgentMessage
                    {
                        Type = "command_result",

                        AgentId = _agentId,

                        Command =
                            received.Command,

                        Success =
                            success,

                        RequestId =
                            received.RequestId,

                        SessionId =
                            received.SessionId
                    };

                string json =
                    JsonSerializer.Serialize(
                        result
                    );

                await _webSocketClient.SendAsync(
                    json
                );
            }
        }
    }

    public async Task StopAsync()
    {
        Console.WriteLine(
            "Stopping Desktop Agent..."
        );

        _cancellationTokenSource.Cancel();

        await _webSocketClient.DisconnectAsync();

        _telemetryService.Dispose();
    }
}