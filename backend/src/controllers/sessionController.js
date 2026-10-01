const { SessionService } = require('../services/sessionService');

/**
 * POST /api/sessions/start
 * Payload examples:
 * - Postpaid: { "userId": 1, "stationId": 3 }
 * - Prepaid:  { "userId": 1, "stationId": 3, "billingType": "prepaid", "durationHours": 2 }
 */
const startSession = async (req, res) => {
  try {
    const { userId, stationId, hourlyRate, billingType, durationHours } = req.body;
    if (!userId || !stationId) {
      return res.status(400).json({ error: 'userId and stationId are required.' });
    }
    const result = await SessionService.startSession({
      userId,
      stationId,
      hourlyRate,
      billingType,
      durationHours
    });
    return res.status(201).json({ message: 'Session started successfully', ...result });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const stopSession = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await SessionService.stopSession(id);
    return res.status(200).json({ message: 'Session ended and billed successfully', ...result });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const togglePauseSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await SessionService.togglePauseSession(id);
    return res.status(200).json({ message: 'Session status toggled successfully', session });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const cancelSession = async (req, res) => {
  try {
    const { id } = req.params;
    const session = await SessionService.cancelSession(id);
    return res.status(200).json({ message: 'Session cancelled successfully', session });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const getActiveSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: 'userId parameter is required.' });
    }
    const sessions = await SessionService.getActiveSessions(userId);
    return res.status(200).json(sessions);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  startSession,
  stopSession,
  togglePauseSession,
  cancelSession,
  getActiveSessions
};
