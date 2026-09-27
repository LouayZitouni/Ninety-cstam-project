const express = require('express');
const router = express.Router();
const {
  getAlerts,
  getAlertsByStation,
  resolveAlert
} = require('../controllers/alertController');
const { protect } = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/roleCheck');

router.use(protect, isAdmin);

router.get('/', getAlerts);

router.get('/station/:stationId', getAlertsByStation);

router.patch('/:id/resolve', resolveAlert);

module.exports = router;