using System.Text.Json;
using DesktopAgent.Communication;

namespace DesktopAgent.Core;


public class Agent
{
    private readonly HeartbeatService _heartbeatService;
    private readonly CancellationTokenSource _cancellationTokenSource;
    private readonly AgentConfig _config;
    private readonly WebSocketClient _webSocketClient;
    private readonly MessageHandler _messageHandler;

    public Agent(AgentConfig config)
{
    _config = config;

    _webSocketClient = new WebSocketClient();

    _messageHandler = new MessageHandler();

    _cancellationTokenSource =
        new CancellationTokenSource();

    _heartbeatService = new HeartbeatService(
        _webSocketClient,
        _config.AgentId
    );
}
    private async Task RegisterAsync()
{
    AgentMessage registration = new AgentMessage
    {
        Type = "register",
        AgentId = _config.AgentId
    };

    string json =
        JsonSerializer.Serialize(registration);

    await _webSocketClient.SendAsync(json);

    Console.WriteLine("Agent registered.");
}

    public async Task StartAsync()
{
    Console.WriteLine("Desktop Agent started.");
    Console.WriteLine($"Agent ID: {_config.AgentId}");

    _ = _heartbeatService.StartAsync(
        _cancellationTokenSource.Token
    );

    while (true)
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

        Console.WriteLine(
            "Connection lost. Reconnecting in 5 seconds..."
        );

        await Task.Delay(5000);
    }
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

        bool success =
            _messageHandler.Handle(message);

        AgentMessage? received =
            JsonSerializer.Deserialize<AgentMessage>(
                message,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }
            );

        if (received?.Type == "command")
        {
            AgentMessage result = new AgentMessage
            {
                Type = "command_result",
                AgentId = _config.AgentId,
                Command = received.Command,
                Success = success
            };

            string json =
                JsonSerializer.Serialize(result);

            await _webSocketClient.SendAsync(json);
        }
    }
}