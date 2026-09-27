const db = require('./postgresPool');

const TIER_DEFAULT_SPECS = {
  STANDARD: {
    cpu: 'Intel i5-12400F',
    gpu: 'NVIDIA RTX 3060',
    ram: '16GB DDR4',
    display: '144Hz'
  },
  VIP: {
    cpu: 'Intel i7-13700K',
    gpu: 'NVIDIA RTX 4080',
    ram: '32GB DDR5',
    display: '240Hz'
  }
};

const TIER_RATES = {
  STANDARD: 10.00,
  VIP: 25.00
};

const createStation = async ({ name, tier = 'STANDARD', hourlyRate, specifications }) => {
  const finalSpecs = specifications || TIER_DEFAULT_SPECS[tier] || TIER_DEFAULT_SPECS.STANDARD;

  const queryText = `
    INSERT INTO stations (name, tier, hourly_rate, specifications)
    VALUES ($1, $2, $3, $4::jsonb)
    RETURNING id, name, status, tier, hourly_rate, specifications, created_at;
  `;

  const { rows } = await db.query(queryText, [
    name,
    tier,
    hourlyRate,
    JSON.stringify(finalSpecs)
  ]);

  return rows[0];
};

const findStationById = async (id) => {
  const queryText = `
    SELECT id, name, tier, status, hourly_rate, specifications, created_at
    FROM stations
    WHERE id = $1;
  `;
  const { rows } = await db.query(queryText, [id]);
  return rows[0];
};

const findStationByName = async (name) => {
  const queryText = `
    SELECT id, name, tier, status, hourly_rate, specifications, created_at
    FROM stations
    WHERE LOWER(name) = LOWER($1);
  `;
  const { rows } = await db.query(queryText, [name]);
  return rows[0];
};

const findStationsByGpu = async (gpuName) => {
  const queryText = `
    SELECT id, name, tier, status, hourly_rate, specifications
    FROM stations
    WHERE specifications->>'gpu' ILIKE $1;
  `;
  const { rows } = await db.query(queryText, [`%${gpuName}%`]);
  return rows;
};

const getAllStations = async (tierFilter = null) => {
  let queryText = 'SELECT id, name, status, tier, hourly_rate, specifications FROM stations';
  const params = [];

  if (tierFilter) {
    queryText += ' WHERE tier = $1';
    params.push(tierFilter);
  }

  queryText += ' ORDER BY name ASC;';
  const { rows } = await db.query(queryText, params);
  return rows;
};

const updateStationStatus = async (id, status) => {
  const queryText = `
    UPDATE stations
    SET status = $1
    WHERE id = $2
    RETURNING id, name, status, tier, hourly_rate, specifications;
  `;
  const { rows } = await db.query(queryText, [status, id]);
  return rows[0];
};

async function upsertStation({ stationId, machineName, tier = 'STANDARD' }) {

  const selectedTier = TIER_DEFAULT_SPECS[tier] ? tier : 'STANDARD';
  const specifications = TIER_DEFAULT_SPECS[selectedTier];
  const hourlyRate = TIER_RATES[selectedTier];

  const query = `
    INSERT INTO stations (id, name, status, tier, hourly_rate, specifications)
    VALUES ($1, $2, 'AVAILABLE',$3,$4,$5)
    ON CONFLICT (id) DO UPDATE 
    SET status = 'AVAILABLE',
        name = EXCLUDED.name;
  `;

  return await db.query(query, [
    stationId, 
    machineName || 'Station Sans Nom', 
    selectedTier,
    hourlyRate,
    JSON.stringify(specifications)
  ]);
}

module.exports = {
  createStation,
  findStationById,
  findStationByName,
  findStationsByGpu,
  getAllStations,
  updateStationStatus,
  upsertStation
};
