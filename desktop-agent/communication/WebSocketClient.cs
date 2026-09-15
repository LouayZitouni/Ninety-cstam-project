using System.Net.WebSockets;
using System.Text;

namespace DesktopAgent.Communication;

public class WebSocketClient
{
    private readonly ClientWebSocket _socket;

    public WebSocketClient()
    {
        _socket = new ClientWebSocket();
    }

    public async Task ConnectAsync(string serverUrl)
    {
        Uri serverUri = new Uri(serverUrl);

        Console.WriteLine("Connecting to server...");

        await _socket.ConnectAsync(
            serverUri,
            CancellationToken.None
        );

        Console.WriteLine("Connected to server.");
    }

    public async Task SendAsync(string message)
    {
        byte[] messageBytes = Encoding.UTF8.GetBytes(message);

        await _socket.SendAsync(
            new ArraySegment<byte>(messageBytes),
            WebSocketMessageType.Text,
            true,
            CancellationToken.None
        );

        Console.WriteLine($"Sent: {message}");
    }

    public async Task<string?> ReceiveAsync()
    {
        byte[] buffer = new byte[1024];

        WebSocketReceiveResult result = await _socket.ReceiveAsync(
            new ArraySegment<byte>(buffer),
            CancellationToken.None
        );

        if (result.MessageType == WebSocketMessageType.Close)
        {
            return null;
        }

        string message = Encoding.UTF8.GetString(
            buffer,
            0,
            result.Count
        );

        return message;
    }
}