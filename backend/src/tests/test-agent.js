const { io } = require('socket.io-client');

const socket = io('http://127.0.0.1:5000', {
  transports: ['polling', 'websocket']
});

const TARGET_STATION_ID = 'f979c219-afeb-4220-90d0-826ab9a789e1'.trim(); 

socket.on('connect', () => {
  console.log(`🔌 CONNECTED! Socket ID: ${socket.id}`);
  socket.emit('REGISTER_AGENT', { stationId: TARGET_STATION_ID });
});

// Receive outbound command schema
socket.on('STATION_COMMAND', (data) => {
  console.log('⚡ RECEIVED OUTBOUND COMMAND:', data);

  setTimeout(() => {
    const resultPayload = {
      commandId: data.commandId,
      stationId: TARGET_STATION_ID,
      type: 'COMMAND_RESULT',
      status: 'SUCCESS',
      payload: {
        stdout: `Executed command '${data.payload?.command || data.type}' successfully.`,
        stderr: '',
        exitCode: 0
      },
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Emitting COMMAND_RESULT back to server...`);
    socket.emit('COMMAND_RESULT', resultPayload);
  }, 1000);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from backend');
});