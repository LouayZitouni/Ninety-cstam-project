const db = require('./postgresPool');

const createUser = async ({ username, email, passwordHash, role = 'CUSTOMER' }) => {
  const query = `
    INSERT INTO users (username, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, username, email, role, balance, created_at;
  `;
  const values = [username, email, passwordHash, role];
  const { rows } = await db.query(query, values);
  return rows[0];
};

const findUserByEmail = async (email) => {
  const query = `SELECT * FROM users WHERE LOWER(email) = LOWER($1);`;
  const { rows } = await db.query(query, [email]);
  return rows[0];
};

const findUserById = async (id) => {
  const query = `SELECT id, username, email, role, balance, created_at FROM users WHERE id = $1;`;
  const { rows } = await db.query(query, [id]);
  return rows[0];
};

const getAllUsers = async () =>{
    const query = `SELECT * FROM users` ;
    const {rows} = await db.query(query,[]);
    return rows[0];
}

const deleteUserByEmail = async (email) =>{
  const query=`DELETE FROM users WHERE LOWER(email) =LOWER($1) 
  RETURNING id, username, email, role, created_at`;
  const {rows} = await db.query(query,[email]);
  return rows[0];
}

const saveRefreshToken = async (userId, refreshToken) => {
  const query = `
    UPDATE users 
    SET refresh_token = $1, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $2;
  `;
  await db.query(query, [refreshToken, userId]);
};

const revokeRefreshToken = async (userId) => {
  const query = `
    UPDATE users 
    SET refresh_token = NULL, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $1 
    RETURNING id, email;
  `;
  const { rows } = await db.query(query, [userId]);
  return rows[0];
};

const findUserByRefreshToken = async (refreshToken) => {
  const query = `
    SELECT id, username, email, role, refresh_token 
    FROM users 
    WHERE refresh_token = $1;
  `;
  const { rows } = await db.query(query, [refreshToken]);
  return rows[0];
};

module.exports ={
    getAllUsers,
    findUserById,
    findUserByEmail,
    createUser,
    deleteUserByEmail,
    revokeRefreshToken,
    saveRefreshToken,
    findUserByRefreshToken
}
