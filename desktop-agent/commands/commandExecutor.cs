using DesktopAgent.Core;
using DesktopAgent.Windows;

namespace DesktopAgent.Commands;

public class CommandExecutor
{
    private readonly WindowsManager _windowsManager;
    private readonly AgentStateService _stateService;

    public CommandExecutor(AgentStateService stateService)
    {
        _windowsManager = new WindowsManager();
        _stateService = stateService;
    }

    public bool Execute(Command command)
    {
        if (string.IsNullOrWhiteSpace(command.CommandName))
        {
            return false;
        }

        // Convert incoming command to uppercase to match server dispatch strings exactly
        string commandName = command.CommandName.Trim().ToUpperInvariant();

        switch (commandName)
        {
            case "LOCK_SCREEN":
            case "LOCK":
            {
                bool success = _windowsManager.Lock();
                if (success)
                {
                    _stateService.SetLocked(true);
                }
                return success;
            }

            case "UNLOCK_SCREEN":
            case "UNLOCK":
            {
                bool success = _windowsManager.Unlock();
                if (success)
                {
                    _stateService.SetLocked(false);
                }
                return success;
            }

            case "SHUTDOWN":
                return _windowsManager.Shutdown();

            case "RESTART":
                return _windowsManager.Restart();

            case "EXEC_SHELL":
                return _windowsManager.ExecuteShell(command);

            default:
                Console.WriteLine($"Rejected unknown command: {commandName}");
                return false;
        }
    }
}