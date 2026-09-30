using DesktopAgent.Models;

namespace DesktopAgent.Core;

public class AgentStateService
{
    private readonly object _lock = new();

    public AgentState State { get; } = new();

    public void StartSession(string sessionId)
    {
        lock (_lock)
        {
            State.StartSession(sessionId);
        }
    }

    public void EndSession()
    {
        lock (_lock)
        {
            State.EndSession();
        }
    }

    public void SetLocked(bool locked)
    {
        lock (_lock)
        {
            State.SetLocked(locked);
        }
    }

    public bool IsLocked
    {
        get
        {
            lock (_lock)
            {
                return State.IsLocked;
            }
        }
    }

    public bool InSession
    {
        get
        {
            lock (_lock)
            {
                return State.InSession;
            }
        }
    }

    public string? SessionId
    {
        get
        {
            lock (_lock)
            {
                return State.SessionId;
            }
        }
    }
}