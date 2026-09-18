const { sendCommandToStation } = require('../protocols/agentSocketHandler');

const sendRemoteCommand = async (req, res, next) => {
  try {
    const { stationId } = req.params;
    const { type, payload, timeoutMs } = req.body; 

    const allowedTypes = ['EXEC_SHELL', 'LOCK_SCREEN', 'UNLOCK_SCREEN', 'SHUTDOWN', 'RESTART'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid command type' });
    }

    const commandId = sendCommandToStation(stationId, type, payload, timeoutMs || 10000);

    if (!commandId) {
      return res.status(404).json({
        success: false,
        error: 'Station Agent is offline or not connected'
      });
    }

    return res.status(200).json({
      success: true,
      commandId,
      message: `Command type '${type}' dispatched to station ${stationId}`
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendRemoteCommand };