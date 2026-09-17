const { io } = require('socket.io-client');

console.log('🚀 Script started. Trying to reach http://127.0.0.1:5000...');

// Use 127.0.0.1 instead of localhost to bypass Node IPv6 resolution
const socket = io('http://127.0.0.1:5000', {
  transports: ['polling', 'websocket']
});

// ⚠️ Make sure this ID exists in your PostgreSQL stations table!
const TARGET_STATION_ID = 'f979c219-afeb-4220-90d0-826ab9a789e1'.trim(); 

socket.on('connect', () => {
  console.log(`🔌 CONNECTED! Socket ID: ${socket.id}`);
  
  socket.emit('REGISTER_AGENT', { stationId: TARGET_STATION_ID });
  console.log(`📡 Sent REGISTER_AGENT for station: ${TARGET_STATION_ID}`);
});

socket.on('STATION_COMMAND', (data) => {
  console.log('⚡ RECEIVED REMOTE COMMAND FROM ADMIN:', data);
});

socket.on('connect_error', (err) => {
  console.error('❌ Connection Failed:', err.message);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from backend');
});