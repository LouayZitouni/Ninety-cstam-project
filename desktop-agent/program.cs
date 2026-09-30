using System.Text.Json;
using DesktopAgent.Core;

string json =
    await File.ReadAllTextAsync(
        "appsettings.json"
    );

AgentConfig? config =
    JsonSerializer.Deserialize<AgentConfig>(
        json,
        new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }
    );

if (config == null)
{
    throw new Exception(
        "Could not load configuration."
    );
}

if (string.IsNullOrWhiteSpace(
    config.ServerUrl))
{
    throw new Exception(
        "ServerUrl is missing from configuration."
    );
}

AgentIdentityService identityService =
    new AgentIdentityService();

string agentId =
    await identityService.GetOrCreateAgentIdAsync();

Agent agent =
    new Agent(
        config,
        agentId
    );

Console.CancelKeyPress +=
    async (sender, e) =>
    {
        e.Cancel = true;

        await agent.StopAsync();
    };

await agent.StartAsync();