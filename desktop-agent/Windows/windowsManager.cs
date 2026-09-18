using System.Diagnostics;
using System.Runtime.InteropServices;

namespace DesktopAgent.Windows;

public class WindowsManager
{
    [DllImport("user32.dll")]
    private static extern bool LockWorkStation();

    public bool Lock()
    {
        try
        {
            Console.WriteLine(
                "Locking Windows..."
            );

            return LockWorkStation();
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"Lock failed: {ex.Message}"
            );

            return false;
        }
    }

    public bool Shutdown()
    {
        try
        {
            Console.WriteLine(
                "Shutting down Windows..."
            );

            Process.Start(
                new ProcessStartInfo
                {
                    FileName = "shutdown.exe",
                    Arguments = "/s /t 0",
                    CreateNoWindow = true,
                    UseShellExecute = false
                }
            );

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"Shutdown failed: {ex.Message}"
            );

            return false;
        }
    }

    public bool Restart()
    {
        try
        {
            Console.WriteLine(
                "Restarting Windows..."
            );

            Process.Start(
                new ProcessStartInfo
                {
                    FileName = "shutdown.exe",
                    Arguments = "/r /t 0",
                    CreateNoWindow = true,
                    UseShellExecute = false
                }
            );

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"Restart failed: {ex.Message}"
            );

            return false;
        }
    }
}