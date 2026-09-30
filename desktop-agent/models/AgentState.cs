namespace DesktopAgent.Models;

public class AgentState
{
    public bool IsLocked { get; private set; }

    public bool InSession { get; private set; }

    public string? SessionId { get; private set; }

    public DateTime LastStateChangeUtc { get; private set; }

    public AgentState()
    {
        LastStateChangeUtc =
            DateTime.UtcNow;
    }

    public void StartSession(
        string sessionId)
    {
        if (string.IsNullOrWhiteSpace(
            sessionId))
        {
            throw new ArgumentException(
                "Session ID cannot be empty.",
                nameof(sessionId)
            );
        }

        SessionId = sessionId;
        InSession = true;

        LastStateChangeUtc =
            DateTime.UtcNow;
    }

    public void EndSession()
    {
        SessionId = null;
        InSession = false;

        LastStateChangeUtc =
            DateTime.UtcNow;
    }

    public void SetLocked(
        bool locked)
    {
        IsLocked = locked;

        LastStateChangeUtc =
            DateTime.UtcNow;
    }
}