require('dotenv').config();
const http = require('http');
const app = require('./app');
const { initSocket } = require('./protocols/agentSocketHandler');
const server = http.createServer(app);

initSocket(server);

const { testConnection } = require('./infrastructure/database/postgresPool');

const PORT = process.env.PORT

const startServer = async ()=>{
    await testConnection();
    server.listen(PORT , ()=>{
        console.log(`[SERVER RUNNING] Listening on port ${PORT}`);
    });
}

startServer();