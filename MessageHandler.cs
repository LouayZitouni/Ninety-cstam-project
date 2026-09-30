using System.Text.Json;
using DesktopAgent.Commands;

namespace DesktopAgent.Communication;

public class MessageHandler
{
    private readonly CommandExecutor _commandExecutor;

    public MessageHandler()
    {
        _commandExecutor =
    new CommandExecutor(stateService);
    }

    public bool Handle(
        string json,
        string currentAgentId)
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

            if (!string.IsNullOrWhiteSpace(
                    message.AgentId) &&
                message.AgentId != currentAgentId)
            {
                Console.WriteLine(
                    "Rejected message for another agent."
                );

                return false;
            }

            switch (message.Type)
            {
                case "command":
                    return HandleCommand(message);

                case "session_start":
                    return HandleSessionStart(message);

                case "session_end":
                    return HandleSessionEnd(message);

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
            Console.WriteLine(
                "Invalid JSON received."
            );

            return false;
        }
    }

    private bool HandleCommand(
        AgentMessage message)
    {
        if (string.IsNullOrWhiteSpace(
            message.Command))
        {
            return false;
        }

        Command command =
            new Command
            {
                Type = "command",
                AgentId = message.AgentId,
                CommandName = message.Command,
                SessionId = message.SessionId
            };

        Console.WriteLine(
            $"Executing command: {command.CommandName}"
        );

        return _commandExecutor.Execute(
            command
        );
    }

    private bool HandleSessionStart(
        AgentMessage message)
    {
        if (string.IsNullOrWhiteSpace(
            message.SessionId))
        {
            Console.WriteLine(
                "Session start rejected: missing session ID."
            );

            return false;
        }

        Console.WriteLine(
            $"Gaming session started: {message.SessionId}"
        );

        return true;
    }

    private bool HandleSessionEnd(
        AgentMessage message)
    {
        Console.WriteLine(
            $"Gaming session ended: {message.SessionId}"
        );

        return true;
    }
}