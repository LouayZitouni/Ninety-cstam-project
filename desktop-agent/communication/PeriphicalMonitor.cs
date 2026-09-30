using System.Management;

namespace DesktopAgent.Communication;

public class PeripheralMonitor
{
    private bool? _previousKeyboardState;
    private bool? _previousMouseState;

    public PeripheralChange? Check()
    {
        bool keyboardConnected = false;
        bool mouseConnected = false;

        try
        {
            using ManagementObjectSearcher searcher =
                new ManagementObjectSearcher(
                    "SELECT Name, PNPClass " +
                    "FROM Win32_PnPEntity " +
                    "WHERE ConfigManagerErrorCode = 0"
                );

            foreach (ManagementObject obj
                     in searcher.Get())
            {
                string? name =
                    obj["Name"]?.ToString();

                string? pnpClass =
                    obj["PNPClass"]?.ToString();

                if (string.IsNullOrWhiteSpace(name))
                {
                    continue;
                }

                if (
                    pnpClass == "Keyboard" ||
                    name.Contains("keyboard",StringComparison.OrdinalIgnoreCase)
                )
                {
                    keyboardConnected = true;
                }

                if (
                    pnpClass == "Mouse" ||
                    name.Contains(
                        "mouse",
                        StringComparison.OrdinalIgnoreCase)
                )
                {
                    mouseConnected = true;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"Peripheral monitor error: {ex.Message}"
            );

            return null;
        }

        PeripheralChange? change = null;

        if (_previousKeyboardState.HasValue &&
            _previousKeyboardState.Value &&
            !keyboardConnected)
        {
            change = new PeripheralChange
            {
                Device = "keyboard",
                Connected = false
            };
        }

        if (_previousMouseState.HasValue &&
            _previousMouseState.Value &&
            !mouseConnected)
        {
            change = new PeripheralChange
            {
                Device = "mouse",
                Connected = false
            };
        }

        _previousKeyboardState =
            keyboardConnected;

        _previousMouseState =
            mouseConnected;

        return change;
    }
}

public class PeripheralChange
{
    public string Device { get; set; } = "";

    public bool Connected { get; set; }
}