using System.Text.Json;

namespace DesktopAgent.Communication;

public class HeartbeatService
{
    private readonly WebSocketClient _webSocketClient;
    private readonly string _agentId;

    public HeartbeatService(
        WebSocketClient webSocketClient,
        string agentId)
    {
        _webSocketClient = webSocketClient;
        _agentId = agentId;
    }

    public async Task StartAsync(
        CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            if (_webSocketClient.IsConnected)
            {
                AgentMessage heartbeat =
                    new AgentMessage
                    {
                        Type = "heartbeat",
                        AgentId = _agentId
                    };

                try
                {
                    string json =
                        JsonSerializer.Serialize(
                            heartbeat
                        );

                    await _webSocketClient.SendAsync(
                        json
                    );
                }
                catch
                {
                    // Reconnection is handled by Agent.
                }
            }

            try
            {
                await Task.Delay(
                    TimeSpan.FromSeconds(10),
                    cancellationToken
                );
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }
    }
}