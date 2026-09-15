using DesktopAgent.Communication;

namespace DesktopAgent.Core;

public class Agent
{
    private readonly AgentConfig _config;
    private readonly WebSocketClient _webSocketClient;

    public Agent(AgentConfig config)
    {
        _config = config;
        _webSocketClient = new WebSocketClient();
    }

    public async Task StartAsync()
    {
        Console.WriteLine("Desktop Agent started.");
        Console.WriteLine($"Agent ID: {_config.AgentId}");

        await _webSocketClient.ConnectAsync(
            _config.ServerUrl
        );

        await _webSocketClient.SendAsync(
            $"Hello from {_config.AgentId}!"
        );

        string? response = await _webSocketClient.ReceiveAsync();

        if (response != null)
        {
            Console.WriteLine(
                $"Server response: {response}"
            );
        }
    }
}