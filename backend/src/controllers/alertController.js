const alertService = require('../services/alertService');

const getAlerts = async (req, res, next) => {
  try {
    const { status, limit } = req.query;
    const alerts = await alertService.getAlerts({ status, limit });

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: { alerts }
    });
  } catch (err) {
    next(err);
  }
};

const getAlertsByStation = async (req, res, next) => {
  try {
    const { stationId } = req.params;
    const alerts = await alertService.getAlertsByStation(stationId);

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: { alerts }
    });
  } catch (err) {
    next(err);
  }
};

const resolveAlert = async (req, res, next) => {
  try {
    const { id } = req.params;
    const alert = await alertService.resolveAlert(id, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Alert resolved successfully',
      data: { alert }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAlerts,
  getAlertsByStation,
  resolveAlert
};