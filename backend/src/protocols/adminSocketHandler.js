let ioInstance;

const initAdminSockets = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Admin clients join the dedicated admin room upon connection/auth
    socket.on('JOIN_ADMIN_ROOM', () => {
      socket.join('admins');
      console.log(`👨‍💻 Admin client joined admin room: [${socket.id}]`);
    });

    socket.on('LEAVE_ADMIN_ROOM', () => {
      socket.leave('admins');
      console.log(`👨‍💻 Admin client left admin room: [${socket.id}]`);
    });
  });
};

// Dispatch security alerts to all admins
const notifyAdminsOfAlert = (alertPayload) => {
  if (ioInstance) {
    ioInstance.to('admins').emit('ADMIN_SECURITY_ALERT', alertPayload);
  }
};

// Dispatch telemetry updates to all admins
const broadcastTelemetryToAdmins = (telemetryPayload) => {
  if (ioInstance) {
    ioInstance.to('admins').emit('ADMIN_TELEMETRY_UPDATE', telemetryPayload);
  }
};

// Dispatch station status updates (AVAILABLE, OFFLINE, OCCUPIED)
const broadcastStationStatus = (stationId, status) => {
  if (ioInstance) {
    ioInstance.to('admins').emit('ADMIN_STATION_STATUS_CHANGE', { stationId, status, timestamp: new Date() });
  }
};

module.exports = {
  initAdminSockets,
  notifyAdminsOfAlert,
  broadcastTelemetryToAdmins,
  broadcastStationStatus
};
