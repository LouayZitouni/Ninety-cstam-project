const express = require('express');
const router = express.Router();
const { sendRemoteCommand } = require('../controllers/adminController');
const { protect } = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/roleCheck');

// Protect route so only ADMIN / STAFF can send remote commands
router.post('/stations/:stationId/command', protect, isAdmin, sendRemoteCommand);

module.exports = router;