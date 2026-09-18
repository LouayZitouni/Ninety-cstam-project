class AgentRegistry {
  constructor() {
    this.connectedAgents = new Map(); // stationId -> socketId
  }

  register(stationId, socketId) {
    this.connectedAgents.set(stationId, socketId);
  }

  unregister(stationId) {
    this.connectedAgents.delete(stationId);
  }

  getSocketId(stationId) {
    return this.connectedAgents.get(stationId);
  }

  isConnected(stationId) {
    return this.connectedAgents.has(stationId);
  }
}

module.exports = new AgentRegistry();