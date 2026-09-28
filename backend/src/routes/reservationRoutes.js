const express = require('express');
const router = express.Router();

const { createReservation } = require('../controllers/reservationController');
const { protect } = require('../middlewares/auth');

// POST /api/reservations - Create a new reservation
router.post('/', protect, createReservation);

module.exports = router;