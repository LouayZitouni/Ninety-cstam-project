const createReservationRecord = async (
  client, 
  { stationId, userId, startTime, endTime, durationMinutes, bookingType = 'RESERVATION' }
) => {
  const query = `
    INSERT INTO reservations (station_id, user_id, start_time, end_time, duration_minutes, booking_type, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVE')
    RETURNING *;
  `;
  const values = [
    stationId, 
    userId || null, 
    startTime, 
    endTime, 
    durationMinutes || null, 
    bookingType
  ];
  const { rows } = await client.query(query, values);
  return rows[0];
};

module.exports = {
  createReservationRecord,
};