
const stationRepo = require('../infrastructure/database/stationRepository');

const createStation = async ({ name, tier, hourlyRate, specifications }) => {
  const formattedName = typeof name === 'string' ? name.trim() : name;
  const formattedTier = typeof tier === 'string' ? tier.toUpperCase() : undefined;

  return await stationRepo.createStation({
    name: formattedName,
    tier: formattedTier,
    hourlyRate,
    specifications
  });
};

const getStations = async (tierFilter) => {
  const formattedTier = typeof tierFilter === 'string' ? tierFilter.toUpperCase() : null;
  return await stationRepo.getAllStations(formattedTier);
};

const getStationById = async (id) => {
  const station = await stationRepo.findStationById(id);
  if (!station) {
    const error = new Error('Station not found');
    error.statusCode = 404;
    throw error;
  }
  return station;
};

const getStationByName = async (name) => {
  const station = await stationRepo.findStationByName(name);
  if (!station) {
    const error = new Error('Station not found');
    error.statusCode = 404;
    throw error;
  }
  return station;
};

const getStationsByGpu = async (gpu) => {
  if (!gpu || typeof gpu !== 'string' || !gpu.trim()) {
    const error = new Error('GPU query parameter is required');
    error.statusCode = 400;
    throw error;
  }
  return await stationRepo.findStationsByGpu(gpu.trim());
};

const updateStatus = async (id, status) => {
  const normalizedStatus = typeof status === 'string' ? status.toUpperCase() : null;
  const validStatuses = ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE'];

  if (!normalizedStatus || !validStatuses.includes(normalizedStatus)) {
    const error = new Error('Invalid status provided');
    error.statusCode = 400;
    throw error;
  }

  const updatedStation = await stationRepo.updateStationStatus(id, normalizedStatus);

  if (!updatedStation) {
    const error = new Error('Station not found');
    error.statusCode = 404;
    throw error;
  }

  return updatedStation;
};

const reserveStationStatus = async(stationId,status="RESERVED")=>{
  if(!stationId){
    const error = new Error('station id is required');
    error.statusCode = 400;
    throw error;
  }
  const reserve_station = await stationRepo.reserveStationStatus(stationId , status);
  if(!reserve_station){
    const error = new Error('could not update status');
    error.statusCode = 404;
    throw error;
  }
  return reserve_station;
}

module.exports = {
  createStation,
  getStations,
  getStationById,
  getStationByName,
  getStationsByGpu,
  updateStatus,
  reserveStationStatus
};
