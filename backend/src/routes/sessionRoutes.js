const express = require('express');
const { protect } = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/roleCheck');
const { 
  startSession, 
  stopSession, 
  togglePauseSession, 
  cancelSession, 
  getActiveSessions 
} = require('../controllers/sessionController.js');

const router = express.Router();

router.post('/start', protect, isAdmin, startSession);
router.post('/stop/:id', protect, isAdmin, stopSession);
router.patch('/pause/:id', protect, isAdmin, togglePauseSession);
router.patch('/cancel/:id', protect, isAdmin, cancelSession);
router.get('/active/:userId', protect, isAdmin, getActiveSessions);

module.exports = router;