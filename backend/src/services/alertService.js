const crypto = require('crypto');
const { notifyAdminsOfAlert } = require('../protocols/adminSocketHandler');

// In-memory alert cache (or connect to your database repository)
const alertsStore = [];

const processSecurityEvent = async (eventData) => {
  const { stationId, event, severity, message, timestamp } = eventData;

  const alertPayload = {
    id: crypto.randomUUID(),
    stationId,
    event,
    severity: severity || 'WARNING',
    message,
    status: 'ACTIVE',
    timestamp: timestamp || new Date().toISOString()
  };

  alertsStore.unshift(alertPayload);
  console.log(`🚨 [ALERT SERVICE] Station ${stationId}: ${message} (${alertPayload.severity})`);

  // Broadcast live alert to admin UI
  notifyAdminsOfAlert(alertPayload);

  return alertPayload;
};

const getAlerts = async ({ status, limit = 50 }) => {
  let filtered = alertsStore;
  if (status) {
    filtered = filtered.filter((a) => a.status.toUpperCase() === status.toUpperCase());
  }
  return filtered.slice(0, parseInt(limit, 10));
};

const getAlertsByStation = async (stationId) => {
  return alertsStore.filter((a) => a.stationId === stationId);
};

const resolveAlert = async (alertId, resolvedByUserId) => {
  const alert = alertsStore.find((a) => a.id === alertId);
  if (!alert) {
    const error = new Error('Alert not found');
    error.statusCode = 404;
    throw error;
  }

  alert.status = 'RESOLVED';
  alert.resolvedBy = resolvedByUserId;
  alert.resolvedAt = new Date().toISOString();

  return alert;
};

module.exports = {
  processSecurityEvent,
  getAlerts,
  getAlertsByStation,
  resolveAlert
};