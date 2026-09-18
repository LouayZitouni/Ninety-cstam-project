namespace DesktopAgent.Communication;

public class AgentMessage
{
    public string Type { get; set; } = "";

    public string? AgentId { get; set; }

    public string? Command { get; set; }

    public string? Message { get; set; }

    public bool? Success { get; set; }

    public object? Data { get; set; }

    public string? RequestId { get; set; }

    public string? SessionId { get; set; }
    public string? Event { get; set; }

    public string? Severity { get; set; }
}