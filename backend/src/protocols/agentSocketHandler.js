const { Server } = require('socket.io');
const crypto = require('crypto');
const stationRepo = require('../infrastructure/database/stationRepository');
const agentRegistry = require('../infrastructure/sockets/agentRegistry');

let io;

const initSocket = (server) => {
  io = new Server(server, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);


    socket.on('REGISTER_AGENT', async ({ stationId }) => {
      if (!stationId) return;

      agentRegistry.register(stationId, socket.id);
      socket.stationId = stationId;
      console.log(`✅ Station [${stationId}] mapped to Socket [${socket.id}]`);

      try {
        await stationRepo.updateStationStatus(stationId, 'AVAILABLE');
      } catch (err) {
        console.error(`Failed DB status update for station ${stationId}:`, err.message);
      }
    });


    socket.on('COMMAND_RESULT', (data) => {
      const { commandId, stationId, type, status, payload, timestamp } = data;

      console.log(`📥 RECEIVED [${type}] from Station [${stationId}]:`, {
        commandId,
        status,
        stdout: payload?.stdout,
        stderr: payload?.stderr,
        exitCode: payload?.exitCode,
        timestamp
      });


    });


    socket.on('disconnect', async () => {
      if (socket.stationId) {
        const stationId = socket.stationId;
        agentRegistry.unregister(stationId);
        console.log(`❌ Station [${stationId}] unregistered`);

        try {
          await stationRepo.updateStationStatus(stationId, 'OFFLINE');
        } catch (err) {
          console.error(`Failed DB status update for station ${stationId}:`, err.message);
        }
      }
    });
  });

  return io;
};


const sendCommandToStation = (stationId, type, payload = {}, timeoutMs = 10000) => {
  const socketId = agentRegistry.getSocketId(stationId);
  if (!socketId || !io) return null;

  const commandId = crypto.randomUUID();

  const outboundMessage = {
    commandId,
    type,
    payload,
    timeoutMs
  };

  io.to(socketId).emit('STATION_COMMAND', outboundMessage);
  return commandId;
};

module.exports = { initSocket, sendCommandToStation };