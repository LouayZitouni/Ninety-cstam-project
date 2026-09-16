const { protect } = require('../middlewares/auth');
const isAdmin = require('../middlewares/roleCheck');

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

router.post('/', protect, isAdmin, createStation);

router.get('/',protect,isAdmin,getStations);

router.get('/search/gpu', protect,isAdmin, getStationsByGpu);

router.get('/name/:name',protect,isAdmin, getStationByName);
router.get('/:id',protect,isAdmin, getStationById);

router.patch('/:id/status',protect,isAdmin, updateStatus);

module.exports = router;
