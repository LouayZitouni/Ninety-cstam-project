const pool = require('./postgresPool');

class TransactionRepository {
  static async create({ userId, amount, type }, dbClient = pool) {
    const query = `
      INSERT INTO wallet_transactions (
        user_id, 
        amount, 
        type
      ) 
      VALUES ($1, $2, $3) 
      RETURNING id, user_id, amount, type, created_at, updated_at
    `;

    const values = [userId, amount, type];
    const result = await dbClient.query(query, values);
    return result.rows[0];
  }

  static async getByUserId(userId, { limit = 20, offset = 0 } = {}, dbClient = pool) {
    const query = `
      SELECT 
        id, 
        user_id AS "userId", 
        amount, 
        type, 
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM wallet_transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `;

    const result = await dbClient.query(query, [userId, limit, offset]);
    return result.rows;
  }
}

module.exports = TransactionRepository;