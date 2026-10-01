const { protect } = require('../middlewares/auth');
const {isAdmin} = require('../middlewares/roleCheck');

const express = require('express');
const {
  createStation,
  getStations,
  getStationById,
  getStationByName,
  getStationsByGpu,
  updateStatus,
  reserveStationStatus
} = require('../controllers/stationController');

const { sendRemoteCommand } = require('../controllers/adminController');
const { getStationTelemetry } = require('../controllers/stationController');

const router = express.Router();


router.post('/', protect, isAdmin, createStation);

router.get('/',protect,isAdmin,getStations);

router.get('/search/gpu', protect,isAdmin, getStationsByGpu);

router.get('/name/:name',protect,isAdmin, getStationByName);
router.get('/:id',protect,isAdmin, getStationById);

router.patch('/:id/status',protect,isAdmin, updateStatus);
router.post('/:stationId/command',protect,isAdmin,sendRemoteCommand);
router.post('/reserve/:stationId',protect,reserveStationStatus);
router.get('/:id/telemetry',protect,isAdmin, getStationTelemetry);

module.exports = router;
