using System.Net.WebSockets;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

app.UseWebSockets();

app.Map("/", async context =>
{
    if (!context.WebSockets.IsWebSocketRequest)
    {
        context.Response.StatusCode = 400;
        await context.Response.WriteAsync("WebSocket connection required.");
        return;
    }

    using WebSocket socket = await context.WebSockets.AcceptWebSocketAsync();

    Console.WriteLine("Desktop Agent connected.");

    byte[] buffer = new byte[1024];

    while (socket.State == WebSocketState.Open)
    {
        WebSocketReceiveResult result = await socket.ReceiveAsync(
            new ArraySegment<byte>(buffer),
            CancellationToken.None
        );

        if (result.MessageType == WebSocketMessageType.Close)
        {
            Console.WriteLine("Desktop Agent disconnected.");

            await socket.CloseAsync(
                WebSocketCloseStatus.NormalClosure,
                "Goodbye",
                CancellationToken.None
            );

            break;
        }

        string message = Encoding.UTF8.GetString(
            buffer,
            0,
            result.Count
        );

        Console.WriteLine($"Received: {message}");

        string response = """
{
    "type": "ack",
    "message": "Agent registered successfully"
}
""";

        byte[] responseBytes = Encoding.UTF8.GetBytes(response);

        await socket.SendAsync(
            new ArraySegment<byte>(responseBytes),
            WebSocketMessageType.Text,
            true,
            CancellationToken.None
        );
    }
});

app.Run("http://localhost:5000");