using System.Diagnostics;
using System.Runtime.InteropServices;

namespace DesktopAgent.Windows;

public class WindowsManager
{
    [DllImport("user32.dll")]
    private static extern bool LockWorkStation();

    public void Lock()
    {
        Console.WriteLine("Locking Windows...");

        LockWorkStation();
    }

    public void Shutdown()
    {
        Console.WriteLine("Shutting down Windows...");

        Process.Start(
            new ProcessStartInfo
            {
                FileName = "shutdown.exe",
                Arguments = "/s /t 0",
                CreateNoWindow = true,
                UseShellExecute = false
            }
        );
    }

    public void Restart()
    {
        Console.WriteLine("Restarting Windows...");

        Process.Start(
            new ProcessStartInfo
            {
                FileName = "shutdown.exe",
                Arguments = "/r /t 0",
                CreateNoWindow = true,
                UseShellExecute = false
            }
        );
    }
}