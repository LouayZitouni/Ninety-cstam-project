const db = require('../infrastructure/database/postgresPool');

const findById = async (id) => {
  const query = `SELECT id, username, email, role, agency_id, created_at FROM users WHERE id = $1;`;
  const { rows } = await db.query(query, [id]);
  return rows[0] || null;
};

const findByEmail = async (email) => {
  const query = `SELECT * FROM users WHERE email = $1;`;
  const { rows } = await db.query(query, [email]);
  return rows[0] || null;
};

const createUser = async ({ username, email, passwordHash, role = 'USER', agencyId = null }) => {
  const query = `
    INSERT INTO users (username, email, password_hash, role, agency_id)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, username, email, role, agency_id, created_at;
  `;
  const { rows } = await db.query(query, [username, email, passwordHash, role, agencyId]);
  return rows[0];
};

module.exports = {
  findById,
  findByEmail,
  createUser,
};
