using System.Text.Json;

namespace DesktopAgent.Core;

public class AgentIdentityService
{
    private readonly string _identityFile;

    public AgentIdentityService()
    {
        string folder =
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "NintyGamingHouse"
            );

        Directory.CreateDirectory(folder);

        _identityFile =
            Path.Combine(
                folder,
                "agent-data.json"
            );
    }

    public async Task<string> GetOrCreateAgentIdAsync()
    {
        if (File.Exists(_identityFile))
        {
            try
            {
                string json =
                    await File.ReadAllTextAsync(
                        _identityFile
                    );

                AgentIdentity? identity =
                    JsonSerializer.Deserialize<AgentIdentity>(
                        json
                    );

                if (identity != null &&
                    !string.IsNullOrWhiteSpace(
                        identity.AgentId))
                {
                    return identity.AgentId;
                }
            }
            catch
            {
                // Generate a new identity below.
            }
        }

        string agentId =
            $"PC-{Guid.NewGuid():N}"
                .ToUpperInvariant();

        AgentIdentity newIdentity =
            new AgentIdentity
            {
                AgentId = agentId
            };

        string newJson =
            JsonSerializer.Serialize(
                newIdentity,
                new JsonSerializerOptions
                {
                    WriteIndented = true
                }
            );

        await File.WriteAllTextAsync(
            _identityFile,
            newJson
        );

        return agentId;
    }

    private class AgentIdentity
    {
        public string AgentId { get; set; } = "";
    }
}