public class AgentStatus
{
    public string AgentId { get; set; } = "";

    public bool IsOnline { get; set; }

    public string MachineName { get; set; } = "";

    public double CpuUsage { get; set; }

    public double MemoryUsage { get; set; }

    public double? CpuTemperature { get; set; }

    public double? GpuUsage { get; set; }

    public double? GpuTemperature { get; set; }

    public double? FanSpeed { get; set; }

    public bool KeyboardConnected { get; set; }

    public bool MouseConnected { get; set; }

    public List<string> Peripherals { get; set; } =
        new();

    public bool IsLocked { get; set; }

    public bool InSession { get; set; }

    public string? SessionId { get; set; }
}