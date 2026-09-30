using System;
using System.IO;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace DesktopAgent.Communication
{
    public class WebSocketClient
    {
        private ClientWebSocket? _socket;

        public bool IsConnected => _socket != null && _socket.State == WebSocketState.Open;

        public async Task ConnectAsync(string serverUrl)
        {
            await DisconnectAsync();

            _socket = new ClientWebSocket();
            Uri serverUri = new Uri(serverUrl);

            Console.WriteLine($"Connecting to {serverUri}...");

            await _socket.ConnectAsync(serverUri, CancellationToken.None);

            // Read the initial Engine.IO handshake frame ("0{...}")
            string? initialFrame = await ReceiveAsync();
            if (initialFrame != null && initialFrame.StartsWith("0"))
            {
                // Send Socket.IO namespace connect frame ("40")
                await SendAsync("40");
                Console.WriteLine("Connected to Socket.IO server.");
            }
        }

        public async Task DisconnectAsync()
        {
            if (_socket != null)
            {
                if (_socket.State == WebSocketState.Open || _socket.State == WebSocketState.CloseReceived)
                {
                    await _socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "Closing", CancellationToken.None);
                }
                _socket.Dispose();
                _socket = null;
            }
        }

        public async Task SendAsync(string message)
        {
            if (!IsConnected || _socket == null) return;

            byte[] buffer = Encoding.UTF8.GetBytes(message);
            await _socket.SendAsync(
                new ArraySegment<byte>(buffer),
                WebSocketMessageType.Text,
                true,
                CancellationToken.None
            );
        }

        public async Task SendEventAsync(string eventName, object payload)
        {
            if (!IsConnected) return;

            // Encapsulate into Socket.IO v4 event frame: 42["eventName", payload]
            string jsonPayload = JsonSerializer.Serialize(payload);
            string socketIoFrame = $"42[\"{eventName}\",{jsonPayload}]";

            await SendAsync(socketIoFrame);
        }

        public async Task<string?> ReceiveAsync()
        {
            while (IsConnected && _socket != null)
            {
                byte[] buffer = new byte[8192];
                using MemoryStream messageStream = new MemoryStream();

                while (IsConnected && _socket != null)
                {
                    WebSocketReceiveResult result = await _socket.ReceiveAsync(
                        new ArraySegment<byte>(buffer),
                        CancellationToken.None
                    );

                    if (result.MessageType == WebSocketMessageType.Close)
                    {
                        return null;
                    }

                    messageStream.Write(buffer, 0, result.Count);

                    if (result.EndOfMessage)
                    {
                        break;
                    }
                }

                string rawMessage = Encoding.UTF8.GetString(messageStream.ToArray());

                // Engine.IO Ping ("2") -> Auto-respond with Pong ("3")
                if (rawMessage == "2")
                {
                    await SendAsync("3");
                    continue;
                }

                // Ignore Socket.IO namespace connection acknowledgments ("40")
                if (rawMessage.StartsWith("40"))
                {
                    continue;
                }

                // Socket.IO event frame ("42[...]"): strip the "42" prefix for event parsing
                if (rawMessage.StartsWith("42"))
                {
                    return rawMessage.Substring(2);
                }

                return rawMessage;
            }

            return null;
        }
    }
}