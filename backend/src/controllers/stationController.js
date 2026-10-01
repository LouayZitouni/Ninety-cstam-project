// backend/src/controllers/stationController.js
const stationService = require('../services/stationService');
const  {latestTelemetryCache} = require('../protocols/agentSocketHandler');

const createStation = async (req, res, next) => {
  try {
    const station = await stationService.createStation(req.body);

    res.status(201).json({
      success: true,
      data: { station }
    });
  } catch (err) {
    next(err);
  }
};

const getStations = async (req, res, next) => {
  try {
    const stations = await stationService.getStations(req.query.tier);

    res.status(200).json({
      success: true,
      count: stations.length,
      data: { stations }
    });
  } catch (err) {
    next(err);
  }
};

const getStationById = async (req, res, next) => {
  try {
    const station = await stationService.getStationById(req.params.id);

    res.status(200).json({
      success: true,
      data: { station }
    });
  } catch (err) {
    next(err);
  }
};

const getStationByName = async (req, res, next) => {
  try {
    const station = await stationService.getStationByName(req.params.name);

    res.status(200).json({
      success: true,
      data: { station }
    });
  } catch (err) {
    next(err);
  }
};

const getStationsByGpu = async (req, res, next) => {
  try {
    const stations = await stationService.getStationsByGpu(req.query.gpu);

    res.status(200).json({
      success: true,
      count: stations.length,
      data: { stations }
    });
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const updatedStation = await stationService.updateStatus(
      req.params.id,
      req.body.status
    );

    res.status(200).json({
      success: true,
      data: { station: updatedStation }
    });
  } catch (err) {
    next(err);
  }
};

const reserveStationStatus = async(req,res,next) =>{
  try{
    const { stationId } = req.params;
    const { status } = req.body;
    const station = await stationService.reserveStationStatus(stationId,status);
    res.status(200).json({
      success: true,
      data: { station: station }
    });
  }catch(err){
    next(err);
  }
}; 

const getStationTelemetry = async (req, res) => {
  const { id } = req.params;
  const telemetry = latestTelemetryCache.get(id);

  if (!telemetry) {
    return res.status(404).json({
      success: false,
      message: `No active telemetry received for station ${id}.`
    });
  }

  return res.status(200).json({
    success: true,
    data: telemetry
  });
};

module.exports = {
  createStation,
  getStations,
  getStationById,
  getStationByName,
  getStationsByGpu,
  updateStatus,
  reserveStationStatus,
  getStationTelemetry
};