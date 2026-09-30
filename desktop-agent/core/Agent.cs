using System;
using System.IO;
using System.Net.NetworkInformation;
using System.Reflection;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using DesktopAgent.Communication;

namespace DesktopAgent.Core
{
    public class Agent
    {
        private readonly AgentIdentityService _identityService; 
        private readonly AgentStateService _stateService;
        private readonly SocketIOAgentClient _client;
        private readonly MessageHandler _messageHandler;

        private readonly string _serverUrl;
        private readonly string? _customAgentId;
        private CancellationTokenSource? _cts;

        public Agent() : this("http://127.0.0.1:5000", null) { }

        public Agent(string serverUrl) : this(serverUrl, null) { }

        public Agent(string serverUrl, string? customAgentId)
        {
            _serverUrl = NormalizeSocketUrl(serverUrl);
            _customAgentId = customAgentId;

            _identityService = new AgentIdentityService();
            _stateService = new AgentStateService();
            _client = new SocketIOAgentClient();
            _messageHandler = new MessageHandler(_stateService);
        }

        public Agent(AgentConfig config) : this(config, null) { }

        public Agent(AgentConfig config, string? customAgentId)
        {
            ExtractFromConfig(config, out string? extractedUrl, out string? extractedId);

            _serverUrl = NormalizeSocketUrl(extractedUrl);
            _customAgentId = !string.IsNullOrWhiteSpace(customAgentId) ? customAgentId : extractedId;

            _identityService = new AgentIdentityService();
            _stateService = new AgentStateService();
            _client = new SocketIOAgentClient();
            _messageHandler = new MessageHandler(_stateService);
        }

        public async Task StartAsync(string? overrideServerUrl = null)
        {
            _cts = new CancellationTokenSource();

            // Intercept Ctrl+C to trigger cancellation token across all background tasks
            Console.CancelKeyPress += (sender, e) =>
            {
                e.Cancel = true; // Prevent instant process kill to allow clean shutdown
                Console.WriteLine("\n🛑 Shutdown signal received (Ctrl+C)...");
                _cts?.Cancel();
            };

            string rawId = !string.IsNullOrWhiteSpace(_customAgentId)
                ? _customAgentId
                : await _identityService.GetOrCreateAgentIdAsync();

            string agentId = FormatToGuid(rawId);
            string machineName = Environment.MachineName;
            string targetUrl = !string.IsNullOrWhiteSpace(overrideServerUrl) 
                ? NormalizeSocketUrl(overrideServerUrl) 
                : _serverUrl;

            var telemetryService = new TelemetryService(_client, agentId, _stateService);

            _client.OnCommandReceived += async (jsonStr, jsonElement) =>
            {
                await _messageHandler.HandleCommandAsync(jsonElement, agentId, _client);
            };

            Console.WriteLine("=================================");
            Console.WriteLine("NINETY Desktop Agent");
            Console.WriteLine("=================================");
            Console.WriteLine($"Agent ID: {agentId}");
            Console.WriteLine($"Machine:  {machineName}");
            Console.WriteLine($"Connecting to {targetUrl}...");

            await _client.ConnectAsync(targetUrl, agentId, machineName);

            // Pass the token to the background telemetry task so it stops on Ctrl+C
            _ = Task.Run(() => telemetryService.StartAsync(_cts.Token), _cts.Token);

            Console.WriteLine("Agent registered with server. Press Ctrl+C to exit.");

            try
            {
                await Task.Delay(-1, _cts.Token);
            }
            catch (TaskCanceledException)
            {
                // Expected exception when Ctrl+C triggers _cts.Cancel()
            }
            finally
            {
                await StopAsync();
            }
        }

        public async Task StopAsync()
        {
            if (_cts != null && !_cts.IsCancellationRequested)
            {
                _cts.Cancel();
            }

            Console.WriteLine("Stopping Desktop Agent...");
            await _client.DisconnectAsync();
            Console.WriteLine("Desktop Agent stopped successfully.");
        }

        private static string NormalizeSocketUrl(string? rawUrl)
        {
            if (string.IsNullOrWhiteSpace(rawUrl)) return "http://127.0.0.1:5000";

            string url = rawUrl.Replace("ws://", "http://").Replace("wss://", "https://");

            int socketPathIdx = url.IndexOf("/socket.io", StringComparison.OrdinalIgnoreCase);
            if (socketPathIdx != -1)
            {
                url = url.Substring(0, socketPathIdx);
            }

            return url.TrimEnd('/');
        }

        private string FormatToGuid(string rawId)
        {
            if (string.IsNullOrWhiteSpace(rawId)) return Guid.NewGuid().ToString();

            string hexOnly = rawId.Replace("PC-", "").Trim();

            if (Guid.TryParseExact(hexOnly, "N", out Guid validGuid) || Guid.TryParse(hexOnly, out validGuid))
            {
                return validGuid.ToString();
            }

            using (MD5 md5 = MD5.Create())
            {
                byte[] hash = md5.ComputeHash(Encoding.UTF8.GetBytes(rawId));
                return new Guid(hash).ToString();
            }
        }

        private static void ExtractFromConfig(AgentConfig config, out string? serverUrl, out string? customAgentId)
        {
            serverUrl = null;
            customAgentId = null;

            if (config == null) return;

            Type type = config.GetType();

            var urlProp = type.GetProperty("ServerUrl")
                       ?? type.GetProperty("WebSocketUrl")
                       ?? type.GetProperty("ServerUri")
                       ?? type.GetProperty("Url");

            if (urlProp != null && urlProp.CanRead)
            {
                serverUrl = urlProp.GetValue(config)?.ToString();
            }

            var idProp = type.GetProperty("AgentId")
                      ?? type.GetProperty("StationId")
                      ?? type.GetProperty("DeviceId")
                      ?? type.GetProperty("HardwareId")
                      ?? type.GetProperty("Id");

            if (idProp != null && idProp.CanRead)
            {
                customAgentId = idProp.GetValue(config)?.ToString();
            }
        }
    }
}