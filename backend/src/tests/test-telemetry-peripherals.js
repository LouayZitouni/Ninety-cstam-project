const { io } = require('socket.io-client');

const SERVER_URL = 'http://127.0.0.1:5000';

console.log('🚀 Starting Real-Time Admin Listener for Dynamic Telemetry & Peripherals...\n');

const adminSocket = io(SERVER_URL, { transports: ['websocket'] });

adminSocket.on('connect', () => {
  console.log(`👨‍💻 Admin Dashboard connected to backend [Socket ID: ${adminSocket.id}]`);
  
  adminSocket.emit('JOIN_ADMIN_ROOM');
  console.log('📡 Joined room: "admins". Listening for live agent events...\n');
});

adminSocket.on('ADMIN_TELEMETRY_UPDATE', (telemetry) => {
  const { 
    stationId, 
    cpuUsage, 
    memoryUsage, 
    cpuTemperature, 
    gpuUsage, 
    gpuTemperature, 
    isLocked, 
    inSession 
  } = telemetry;

  console.log(`📊 [TELEMETRY] Station: ${stationId}`);
  console.log(`   ├─ CPU Load: ${cpuUsage}% | Temp: ${cpuTemperature ?? 'N/A'}°C`);
  console.log(`   ├─ GPU Load: ${gpuUsage ?? 'N/A'}% | Temp: ${gpuTemperature ?? 'N/A'}°C`);
  console.log(`   ├─ RAM Usage: ${memoryUsage}%`);
  console.log(`   └─ Status: Locked=${isLocked}, InSession=${inSession}\n`);
});

// 2. Listen for Real Security Alerts (Peripheral Disconnects)
adminSocket.on('ADMIN_SECURITY_ALERT', (alert) => {
  console.log('🚨 ==================== SECURITY ALERT ==================== 🚨');
  console.log(`   Station:   ${alert.stationId}`);
  console.log(`   Event:     ${alert.event}`);
  console.log(`   Severity:  ${alert.severity}`);
  console.log(`   Message:   ${alert.message}`);
  console.log(`   Time:      ${alert.timestamp}`);
  console.log('🚨 ========================================================= 🚨\n');
});

// 3. Listen for Station Online / Offline Status Changes
adminSocket.on('ADMIN_STATION_STATUS_CHANGE', ({ stationId, status }) => {
  console.log(`ℹ️ [STATION STATUS] ${stationId} is now ${status}\n`);
});

adminSocket.on('disconnect', () => {
  console.log('❌ Disconnected from backend server.');
});