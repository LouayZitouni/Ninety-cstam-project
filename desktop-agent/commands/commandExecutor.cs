using DesktopAgent.Core;
using DesktopAgent.Windows;

namespace DesktopAgent.Commands;

public class CommandExecutor
{
    private readonly WindowsManager _windowsManager;
    private readonly AgentStateService _stateService;

    public CommandExecutor(AgentStateService stateService)
    {
<<<<<<< HEAD
        _windowsManager =new WindowsManager();

        _stateService =stateService;
=======
        _windowsManager = new WindowsManager();
        _stateService = stateService;
>>>>>>> b8492b4cf2b9c8272fcc4920732b28ae93ea1bdd
    }

    public bool Execute(Command command)
    {
        if (string.IsNullOrWhiteSpace(command.CommandName))
        {
            return false;
        }

<<<<<<< HEAD
        string commandName =command.CommandName.Trim().ToLowerInvariant();
=======
        // Convert incoming command to uppercase to match server dispatch strings exactly
        string commandName = command.CommandName.Trim().ToUpperInvariant();
>>>>>>> b8492b4cf2b9c8272fcc4920732b28ae93ea1bdd

        switch (commandName)
        {
            case "LOCK_SCREEN":
            case "LOCK":
            {
<<<<<<< HEAD
                bool success =_windowsManager.Lock();

=======
                bool success = _windowsManager.Lock();
>>>>>>> b8492b4cf2b9c8272fcc4920732b28ae93ea1bdd
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