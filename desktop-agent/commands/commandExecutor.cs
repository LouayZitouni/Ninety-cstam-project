using DesktopAgent.Windows;

namespace DesktopAgent.Commands;

public class CommandExecutor
{
    private readonly WindowsManager _windowsManager;

    public CommandExecutor()
    {
        _windowsManager = new WindowsManager();
    }

    public void Execute(Command command)
    {
        switch (command.Type)
        {
            case "shutdown":
                _windowsManager.Shutdown();
                break;

            case "restart":
                _windowsManager.Restart();
                break;

            case "lock":
                _windowsManager.Lock();
                break;

            default:
                Console.WriteLine(
                    $"Unknown command: {command.Type}"
                );
                break;
        }
    }
}