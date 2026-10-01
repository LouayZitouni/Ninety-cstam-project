require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

pool.on('error', (err) => {
  console.error('[DB ERROR] Unexpected error on idle PostgreSQL client:', err.message);
  process.exit(-1);
});

const query = (text, params) => pool.query(text, params);
const getClient = () => pool.connect();

const testConnection = async () => {
  try {
    const res = await query('SELECT NOW() AS current_time, current_database() AS db_name');
    console.log(`[DB CONNECTED] Database: "${res.rows[0].db_name}" | Server Time: ${res.rows[0].current_time}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
};