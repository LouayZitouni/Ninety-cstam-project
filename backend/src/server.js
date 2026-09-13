require('dotenv').config();
const app = require('./app');

const { testConnection } = require('./infrastructure/database/postgresPool');

const PORT = process.env.PORT

const startServer = async ()=>{
    await testConnection();
    app.listen(PORT , ()=>{
        console.log(`[SERVER RUNNING] Listening on port ${PORT}`);
    });
}

startServer();