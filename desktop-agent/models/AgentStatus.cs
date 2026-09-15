namespace DesktopAgent.Models;

public class AgentStatus
{
    public string AgentId { get; set; } = "";

    public bool IsOnline { get; set; }

    public double CpuUsage { get; set; }

    public double MemoryUsage { get; set; }
}