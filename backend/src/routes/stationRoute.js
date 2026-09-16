// backend/src/routes/stationRoutes.js
const express = require('express');
const {
  createStation,
  getStations,
  getStationById,
  getStationByName,
  getStationsByGpu,
  updateStatus
} = require('../controllers/stationController');

const router = express.Router();

router.route('/')
  .get(getStations)
  .post(createStation);

router.get('/search/gpu', getStationsByGpu);

router.get('/name/:name', getStationByName);
router.get('/:id', getStationById);

router.patch('/:id/status', updateStatus);

module.exports = router;
