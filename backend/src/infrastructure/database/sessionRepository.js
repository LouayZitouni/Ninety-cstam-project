const pool = require('./postgresPool');

const SELECT_FIELDS = `
  id,
  user_id AS "userId",
  station_id AS "stationId",
  billing_type AS "billingType",
  start_time AS "startTime",
  end_time AS "endTime",
  total_cost AS "totalCost",
  status,
  created_at AS "createdAt"
`;

// Cartographie des entrées de l'API vers l'ENUM PostgreSQL
const BILLING_TYPE_MAP = {
  'postpaid': 'OPEN_ENDED',
  'open_ended': 'OPEN_ENDED',
  'open-ended': 'OPEN_ENDED',
  'prepaid': 'PREPAID_FIXED',
  'prepaid_fixed': 'PREPAID_FIXED',
  'prepaid-fixed': 'PREPAID_FIXED'
};

const SessionRepository = {
  /**
   * Créer une nouvelle session
   */
  async create({ userId, stationId, billingType = 'postpaid', totalCost = 0.00 }, dbClient = pool) {
    const cleanType = (billingType || '').toString().trim().toLowerCase();
    const formattedBillingType = BILLING_TYPE_MAP[cleanType] || cleanType.toUpperCase();

    const query = `
      INSERT INTO sessions (user_id, station_id, billing_type, total_cost)
      VALUES ($1, $2, $3, $4)
      RETURNING ${SELECT_FIELDS};
    `;
    const { rows } = await dbClient.query(query, [userId, stationId, formattedBillingType, totalCost]);
    return rows[0];
  },

  async findById(id, dbClient = pool) {
    const query = `
      SELECT ${SELECT_FIELDS}
      FROM sessions
      WHERE id = $1;
    `;
    const { rows } = await dbClient.query(query, [id]);
    return rows[0] || null;
  },

  async findActiveByUserId(userId, dbClient = pool) {
    const query = `
      SELECT ${SELECT_FIELDS}
      FROM sessions
      WHERE user_id = $1 AND status IN ('ACTIVE', 'PAUSED');
    `;
    const { rows } = await dbClient.query(query, [userId]);
    return rows;
  },

  async complete(id, totalCost, dbClient = pool) {
    const query = `
      UPDATE sessions
      SET 
        end_time = CURRENT_TIMESTAMP,
        total_cost = $1,
        status = 'COMPLETED'
      WHERE id = $2
      RETURNING ${SELECT_FIELDS};
    `;
    const { rows } = await dbClient.query(query, [totalCost, id]);
    return rows[0] || null;
  },

  async updateStatus(id, status, dbClient = pool) {
    const query = `
      UPDATE sessions
      SET status = $1
      WHERE id = $2
      RETURNING ${SELECT_FIELDS};
    `;
    const { rows } = await dbClient.query(query, [status.toUpperCase(), id]);
    return rows[0] || null;
  },

  async delete(id, dbClient = pool) {
    const query = `DELETE FROM sessions WHERE id = $1;`;
    const result = await dbClient.query(query, [id]);
    return result.rowCount > 0;
  }
};

module.exports = SessionRepository;
module.exports.SessionRepository = SessionRepository;