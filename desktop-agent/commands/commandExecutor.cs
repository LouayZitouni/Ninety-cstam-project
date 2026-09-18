using DesktopAgent.Core;
using DesktopAgent.Windows;

namespace DesktopAgent.Commands;

public class CommandExecutor
{
    private readonly WindowsManager _windowsManager;
    private readonly AgentStateService _stateService;

    public CommandExecutor(
        AgentStateService stateService)
    {
        _windowsManager =
            new WindowsManager();

        _stateService =
            stateService;
    }

    public bool Execute(Command command)
    {
        if (string.IsNullOrWhiteSpace(
            command.CommandName))
        {
            return false;
        }

        string commandName =
            command.CommandName
                .Trim()
                .ToLowerInvariant();

        switch (commandName)
        {
            case "lock":
            {
                bool success =
                    _windowsManager.Lock();

                if (success)
                {
                    _stateService.SetLocked(true);
                }

                return success;
            }

            case "shutdown":
                return _windowsManager.Shutdown();

            case "restart":
                return _windowsManager.Restart();

            default:
                Console.WriteLine(
                    $"Rejected unknown command: {commandName}"
                );

                return false;
        }
    }
}