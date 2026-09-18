using System.Text.Json;
using DesktopAgent.Commands;
using DesktopAgent.Core;

namespace DesktopAgent.Communication;

public class MessageHandler
{
    private readonly CommandExecutor _commandExecutor;
    private readonly AgentStateService _stateService;

    public MessageHandler(
        AgentStateService stateService)
    {
        _stateService = stateService;

        _commandExecutor =
            new CommandExecutor(
                stateService
            );
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

            switch (message.Type.ToLowerInvariant())
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
        catch (Exception ex)
        {
            Console.WriteLine(
                $"Message handling error: {ex.Message}"
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

        try
        {
            _stateService.StartSession(
                message.SessionId
            );

            Console.WriteLine(
                $"Gaming session started: {message.SessionId}"
            );

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"Session start failed: {ex.Message}"
            );

            return false;
        }
    }

    private bool HandleSessionEnd(
        AgentMessage message)
    {
        _stateService.EndSession();

        Console.WriteLine(
            $"Gaming session ended: {message.SessionId}"
        );

        return true;
    }
}