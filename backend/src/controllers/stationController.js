// backend/src/controllers/stationController.js
const stationService = require('../services/stationService');

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

module.exports = {
  createStation,
  getStations,
  getStationById,
  getStationByName,
  getStationsByGpu,
  updateStatus
};