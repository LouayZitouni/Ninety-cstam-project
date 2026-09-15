namespace DesktopAgent.Windows;

public class WindowsManager
{
    public void Shutdown()
    {
        Console.WriteLine("Shutdown requested.");
    }

    public void Restart()
    {
        Console.WriteLine("Restart requested.");
    }

    public void Lock()
    {
        Console.WriteLine("Lock requested.");
    }
}