using DesktopAgent.Windows;

namespace DesktopAgent.Commands;

public class CommandExecutor
{
    private readonly WindowsManager _windowsManager;

    public CommandExecutor()
    {
        _windowsManager = new WindowsManager();
    }

    public bool Execute(Command command)
    {
        if (string.IsNullOrWhiteSpace(command.CommandName))
        {
            return false;
        }

        switch (command.CommandName.ToLower())
        {
            case "shutdown":
                _windowsManager.Shutdown();
                return true;

            case "restart":
                _windowsManager.Restart();
                return true;

            case "lock":
                _windowsManager.Lock();
                return true;

            default:
                Console.WriteLine(
                    $"Unknown command: {command.CommandName}"
                );

                return false;
        }
    }
}