using SocketIOClient;
using System.Text.Json;

namespace DesktopAgent.Communication;

public class SocketIOAgentClient
{
    private SocketIO? _client;
    public bool IsConnected => _client != null && _client.Connected;

    public event Action<string, JsonElement>? OnCommandReceived;

    public async Task ConnectAsync(string serverUrl, string stationId, string machineName, string tier = "STANDARD")
    {
        _client = new SocketIO(new Uri(serverUrl));

        _client.OnConnected += async (sender, e) =>
        {
            Console.WriteLine("Connecté au serveur Socket.IO.");

            await _client.EmitAsync("REGISTER_AGENT", new object[]
            {
                new
                {
                    stationId = stationId,
                    machineName = machineName,
                    tier = tier
                }
            });
        };

        _client.On("STATION_COMMAND", response =>
        {
            try
            {
                var json = response.GetValue<JsonElement>(0);
                OnCommandReceived?.Invoke(json.ToString(), json);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors de la réception de STATION_COMMAND : {ex.Message}");
            }

            return Task.CompletedTask;
        });

        await _client.ConnectAsync();
    }

    public async Task EmitAsync(string eventName, object data)
    {
        if (IsConnected && _client != null)
        {
            await _client.EmitAsync(eventName, new object[] { data });
        }
    }

    public async Task SendCommandResultAsync(string commandId, string stationId, string type, string status, object payload)
    {
        if (!IsConnected || _client == null) return;

        await _client.EmitAsync("COMMAND_RESULT", new object[]
        {
            new
            {
                commandId,
                stationId,
                type,
                status,
                payload,
                timestamp = DateTime.UtcNow.ToString("o")
            }
        });
    }

    public async Task SendSecurityEventAsync(string stationId, string eventName, string severity, string message)
    {
        if (!IsConnected || _client == null) return;

        await _client.EmitAsync("SECURITY_EVENT", new object[]
        {
            new
            {
                stationId,
                @event = eventName,
                severity,
                message,
                timestamp = DateTime.UtcNow.ToString("o")
            }
        });
    }

    public async Task DisconnectAsync()
    {
        if (_client != null && IsConnected)
        {
            await _client.DisconnectAsync();
        }
    }
}