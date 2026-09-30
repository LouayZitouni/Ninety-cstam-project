using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using DesktopAgent.Core;

namespace DesktopAgent.Windows;

public class WindowsManager
{
    [DllImport("user32.dll")]
    private static extern bool LockWorkStation();

    public bool Lock()
    {
        try
        {
            Console.WriteLine("Locking Windows...");
            return LockWorkStation();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Lock failed: {ex.Message}");
            return false;
        }
    }

    public bool Unlock()
    {
        Console.WriteLine("Unlock requested.");
        return true;
    }

    public bool ExecuteShell(Command command)
    {
        try
        {
            string shellCmd = command.Payload?.ToString() ?? "hostname";
            Console.WriteLine($"Executing shell command: {shellCmd}");

            Process.Start(new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = $"/c {shellCmd}",
                CreateNoWindow = true,
                UseShellExecute = false
            });

            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Shell execution failed: {ex.Message}");
            return false;
        }
    }

    public bool Shutdown()
    {
        try
        {
            Console.WriteLine("Shutting down Windows...");
            Process.Start(new ProcessStartInfo
            {
                FileName = "shutdown.exe",
                Arguments = "/s /t 0 /f",
                CreateNoWindow = true,
                UseShellExecute = false
            });
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Shutdown failed: {ex.Message}");
            return false;
        }
    }

    public bool Restart()
    {
        try
        {
            Console.WriteLine("Restarting Windows...");
            Process.Start(new ProcessStartInfo
            {
                FileName = "shutdown.exe",
                Arguments = "/r /t 0 /f",
                CreateNoWindow = true,
                UseShellExecute = false
            });
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Restart failed: {ex.Message}");
            return false;
        }
    }
}