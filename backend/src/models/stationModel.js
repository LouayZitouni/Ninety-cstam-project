const db = require('../infrastructure/database/postgresPool');

const findById = async (stationId) => {
  const query = `
    SELECT s.*, a.name AS agency_name, a.code AS agency_code
    FROM stations s
    LEFT JOIN agencies a ON s.agency_id = a.id
    WHERE s.id = $1;
  `;
  const { rows } = await db.query(query, [stationId]);
  return rows[0] || null;
};

const findAll = async (agencyId = null) => {
  let query = `
    SELECT s.*, a.name AS agency_name
    FROM stations s
    LEFT JOIN agencies a ON s.agency_id = a.id
  `;
  const params = [];

  if (agencyId) {
    query += ` WHERE s.agency_id = $1`;
    params.push(agencyId);
  }

  query += ` ORDER BY s.name ASC;`;
  const { rows } = await db.query(query, params);
  return rows;
};

const updateStatus = async (stationId, status) => {
  const query = `
    UPDATE stations
    SET status = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *;
  `;
  const { rows } = await db.query(query, [status, stationId]);
  return rows[0];
};

const reserveStation = async (stationId) => {
  return updateStatus(stationId, 'RESERVED');
};

module.exports = {
  findById,
  findAll,
  updateStatus,
  reserveStation,
};