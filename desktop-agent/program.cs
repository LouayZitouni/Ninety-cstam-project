using System.Text.Json;
using DesktopAgent.Core;

string json = await File.ReadAllTextAsync("appsettings.json");

AgentConfig? config = JsonSerializer.Deserialize<AgentConfig>(
    json,
    new JsonSerializerOptions
    {
        PropertyNameCaseInsensitive = true
    }
);

if (config == null)
{
    throw new Exception("Could not load configuration.");
}

if (string.IsNullOrWhiteSpace(config.ServerUrl))
{
    throw new Exception("ServerUrl is missing from configuration.");
}

if (string.IsNullOrWhiteSpace(config.AgentId))
{
    throw new Exception("AgentId is missing from configuration.");
}

Agent agent = new Agent(config);

await agent.StartAsync();