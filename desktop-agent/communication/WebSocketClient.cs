using System.Net.WebSockets;
using System.Text;

namespace DesktopAgent.Communication;

public class WebSocketClient
{
    private ClientWebSocket? _socket;

    private readonly SemaphoreSlim _sendLock =new SemaphoreSlim(1, 1);

    public bool IsConnected =>_socket?.State == WebSocketState.Open;

    public async Task ConnectAsync(string serverUrl)
    {
        await DisconnectAsync();

        _socket =new ClientWebSocket();

        Uri serverUri =new Uri(serverUrl);

        Console.WriteLine(
            $"Connecting to {serverUri}..."
        );

        await _socket.ConnectAsync(
            serverUri,
            CancellationToken.None
        );

        Console.WriteLine(
            "Connected to server."
        );
    }

    public async Task SendAsync(string message)
    {
        if (!IsConnected)
        {
            throw new InvalidOperationException(
                "WebSocket is not connected."
            );
        }

        await _sendLock.WaitAsync();

        try
        {
            byte[] bytes =
                Encoding.UTF8.GetBytes(message);

            await _socket!.SendAsync(
                new ArraySegment<byte>(bytes),
                WebSocketMessageType.Text,
                true,
                CancellationToken.None
            );
        }
        finally
        {
            _sendLock.Release();
        }
    }

    public async Task<string?> ReceiveAsync()
    {
        if (!IsConnected)
        {
            return null;
        }

        byte[] buffer =
            new byte[8192];

        using MemoryStream messageStream =
            new MemoryStream();

        while (true)
        {
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

            messageStream.Write(
                buffer,
                0,
                result.Count
            );

            if (result.EndOfMessage)
            {
                break;
            }
        }

        return Encoding.UTF8.GetString(
            messageStream.ToArray()
        );
    }

    public async Task DisconnectAsync()
    {
        if (_socket == null)
        {
            return;
        }

        try
        {
            if (_socket.State == WebSocketState.Open ||
                _socket.State == WebSocketState.CloseReceived)
            {
                await _socket.CloseAsync(
                    WebSocketCloseStatus.NormalClosure,
                    "Agent disconnecting",
                    CancellationToken.None
                );
            }
        }
        catch
        {
            
        }
        finally
        {
            _socket.Dispose();
            _socket = null;
        }
    }
}