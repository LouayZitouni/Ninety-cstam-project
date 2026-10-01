using System.Text.Json.Serialization;

namespace DesktopAgent.Core;

public class Command
{
    [JsonPropertyName("type")]
    public string CommandName { get; set; } = string.Empty;

    [JsonIgnore]
    public string Type
    {
        get => CommandName;
        set => CommandName = value;
    }

    [JsonPropertyName("agentId")]
    public string? AgentId { get; set; }

    [JsonPropertyName("sessionId")]
    public string? SessionId { get; set; }

    [JsonPropertyName("payload")]
    public object? Payload { get; set; }
}