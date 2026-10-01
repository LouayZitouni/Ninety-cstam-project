const db = require('../infrastructure/database/postgresPool');
const { createReservationRecord } = require('../infrastructure/database/reservationRepository');
const { findStationById, updateStationStatus } = require('../infrastructure/database/stationRepository');

const makeReservation = async ({ stationId, userId, startTime, endTime, durationMinutes }) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const station = await findStationById(stationId, client);
    if (!station) {
      const error = new Error('Station not found');
      error.statusCode = 404;
      throw error;
    }

    if (station.status !== 'AVAILABLE') {
      const error = new Error(`Station cannot be reserved because it is currently ${station.status}`);
      error.statusCode = 400;
      throw error;
    }

    const start = startTime ? new Date(startTime) : new Date();
    const end = endTime ? new Date(endTime) : null;

    const reservation = await createReservationRecord(client, {
      stationId,
      userId,
      startTime: start,
      endTime: end,
      durationMinutes: durationMinutes || null,
    });

    const updatedStation = await updateStationStatus(stationId, 'RESERVED', client);

    await client.query('COMMIT');

    return {
      reservation,
      station: updatedStation,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  makeReservation,
};