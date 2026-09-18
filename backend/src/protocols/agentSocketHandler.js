const { Server } = require('socket.io');
const stationRepo = require('../infrastructure/database/stationRepository');

// Map to store active station connections: stationId -> socketId
const connectedAgents = new Map();

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: '*' }
  });

  io.on('connection', async(socket) => {
    console.log(`🔌 Agent trying to connect: ${socket.id}`);

    // Desktop Agent registers upon startup
    socket.on('REGISTER_AGENT', async({ stationId }) => {
      connectedAgents.set(stationId, socket.id);
      socket.stationId = stationId;
      console.log(`✅ Station [${stationId}] registered on Socket [${socket.id}]`);

      try {
        await stationRepo.updateStationStatus(stationId, 'AVAILABLE');
        console.log(`✅ Station [${stationId}] status updated to AVAILABLE in DB`);
      } catch (err) {
        console.error(`Failed to update DB for station ${stationId}:`, err.message);
      }
    });

    // Cleanup on disconnect
    socket.on('disconnect', async() => {
      if (socket.stationId) {
        const disconnectedStationId = socket.stationId;
        connectedAgents.delete(socket.stationId);
        console.log(`❌ Station [${socket.stationId}] disconnected`);

        try {
          await stationRepo.updateStationStatus(disconnectedStationId, 'OFFLINE');
          console.log(`❌ Station [${disconnectedStationId}] status updated to OFFLINE in DB`);
        } catch (err) {
          console.error(`Failed to update DB for station ${disconnectedStationId}:`, err.message);
        }
      }
    });
  });

  return io;
};

// Method to push commands from Express controllers to Desktop Agents
const sendCommandToStation = (stationId, command, payload = {}) => {
  const socketId = connectedAgents.get(stationId);
  if (!socketId || !io) {
    return false; // Station offline or socket server not running
  }

  io.to(socketId).emit('STATION_COMMAND', { command, payload, timestamp: new Date() });
  return true;
};

module.exports = { initSocket, sendCommandToStation };
