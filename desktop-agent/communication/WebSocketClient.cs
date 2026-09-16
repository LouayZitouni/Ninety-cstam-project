using System.Net.WebSockets;
using System.Text;

namespace DesktopAgent.Communication;

public class WebSocketClient
{
    private ClientWebSocket? _socket;

    public bool IsConnected =>
        _socket?.State == WebSocketState.Open;

    public async Task ConnectAsync(string serverUrl)
    {
        _socket = new ClientWebSocket();

        Uri serverUri = new Uri(serverUrl);

        Console.WriteLine(
            $"Connecting to {serverUri}..."
        );

        await _socket.ConnectAsync(
            serverUri,
            CancellationToken.None
        );

        Console.WriteLine("Connected to server.");
    }

    public async Task SendAsync(string message)
    {
        if (!IsConnected)
        {
            throw new InvalidOperationException(
                "WebSocket is not connected."
            );
        }

        byte[] messageBytes =
            Encoding.UTF8.GetBytes(message);

        await _socket!.SendAsync(
            new ArraySegment<byte>(messageBytes),
            WebSocketMessageType.Text,
            true,
            CancellationToken.None
        );
    }

    public async Task<string?> ReceiveAsync()
    {
        if (!IsConnected)
        {
            return null;
        }

        byte[] buffer = new byte[4096];

        WebSocketReceiveResult result =
            await _socket!.ReceiveAsync(
                new ArraySegment<byte>(buffer),
                CancellationToken.None
            );

        if (result.MessageType ==
            WebSocketMessageType.Close)
        {
            return null;
        }

        return Encoding.UTF8.GetString(
            buffer,
            0,
            result.Count
        );
    }

    public async Task DisconnectAsync()
    {
        if (!IsConnected)
        {
            return;
        }

        await _socket!.CloseAsync(
            WebSocketCloseStatus.NormalClosure,
            "Agent shutting down",
            CancellationToken.None
        );
    }
}