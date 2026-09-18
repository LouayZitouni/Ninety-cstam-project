const { sendCommandToStation } = require('../protocols/agentSocketHandler');

const sendRemoteCommand = async (req, res, next) => {
  try {
    const { stationId } = req.params;
    const { command, payload } = req.body; 

    const allowedCommands = ['LOCK_SCREEN', 'UNLOCK_SCREEN', 'SHUTDOWN', 'RESTART'];
    if (!allowedCommands.includes(command)) {
      return res.status(400).json({ success: false, error: 'Invalid remote command' });
    }

    const delivered = sendCommandToStation(stationId, command, payload);

    if (!delivered) {
      return res.status(404).json({
        success: false,
        error: 'Station Agent is offline or not connected'
      });
    }

    return res.status(200).json({
      success: true,
      message: `Command '${command}' sent successfully to station ${stationId}`
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendRemoteCommand };