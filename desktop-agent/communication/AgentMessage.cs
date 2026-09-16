namespace DesktopAgent.Communication;

public class AgentMessage
{
    public string Type { get; set; } = "";

    public string? AgentId { get; set; }

    public string? Command { get; set; }

    public string? Message { get; set; }

    public bool? Success { get; set; }

    public object? Data { get; set; }
}