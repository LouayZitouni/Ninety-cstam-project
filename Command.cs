namespace DesktopAgent.Commands;

public class Command
{
    public string Type { get; set; } = "";

    public string? AgentId { get; set; }

    public string? CommandName { get; set; }

    public string? SessionId { get; set; }
}