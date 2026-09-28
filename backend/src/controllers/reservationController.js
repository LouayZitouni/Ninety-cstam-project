const { makeReservation } = require('../services/reservationService');

const createReservation = async (req, res, next) => {
  try {
    const stationId = req.body.stationId || req.body.station_id;
    const startTime = req.body.startTime || req.body.start_time;
    const endTime = req.body.endTime || req.body.end_time;
    const durationMinutes = req.body.durationMinutes || req.body.duration_minutes;
    const bookingType = req.body.bookingType || req.body.booking_type || 'RESERVATION';

    if (!stationId || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'stationId and endTime are required fields',
      });
    }

    const userId = req.user ? req.user.id : null;

    const result = await makeReservation({
      stationId,
      userId,
      startTime,
      endTime,
      durationMinutes,
      bookingType,
    });

    return res.status(201).json({
      success: true,
      message: 'Station successfully reserved',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createReservation,
};