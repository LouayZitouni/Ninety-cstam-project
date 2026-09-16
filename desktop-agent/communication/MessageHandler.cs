using System.Text.Json;
using DesktopAgent.Commands;

namespace DesktopAgent.Communication;

public class MessageHandler
{
    private readonly CommandExecutor _commandExecutor;

    public MessageHandler()
    {
        _commandExecutor = new CommandExecutor();
    }

    public bool Handle(string json)
    {
        try
        {
            AgentMessage? message =
                JsonSerializer.Deserialize<AgentMessage>(
                    json,
                    new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    }
                );

            if (message == null)
            {
                return false;
            }

            switch (message.Type)
            {
                case "command":
                    return HandleCommand(message);

                case "ack":
                    Console.WriteLine(
                        $"Server: {message.Message}"
                    );
                    return true;

                case "error":
                    Console.WriteLine(
                        $"Server error: {message.Message}"
                    );
                    return false;

                default:
                    Console.WriteLine(
                        $"Unknown message type: {message.Type}"
                    );
                    return false;
            }
        }
        catch (JsonException)
        {
            Console.WriteLine("Invalid JSON.");
            return false;
        }
    }

    private bool HandleCommand(
        AgentMessage message)
    {
        if (string.IsNullOrWhiteSpace(message.Command))
        {
            return false;
        }

        Command command = new Command
        {
            Type = "command",
            AgentId = message.AgentId,
            CommandName = message.Command
        };

        return _commandExecutor.Execute(command);
    }
}