const express = require('express');
require('dotenv').config();
const path = require('path');
const stationRoutes = require('./routes/stationRoute');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const alertRoutes = require('./routes/alertRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();
const subscriptionRoutes = require('./routes/subscriptionRoutes');

app.use('/api/subscriptions', subscriptionRoutes);

app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../visualTesting.html'));
});

app.get('/health', (req , res) => {
  res.status(200).json({
    status: 'success',
    message: 'Ninety Gaming House API is healthy',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/stations', stationRoutes);

app.use('/api/auth', authRoutes);

app.use('/socket', adminRoutes);

app.use('/api/alerts', alertRoutes);

app.use('/api/reservations', reservationRoutes);

app.use('/api/sessions',sessionRoutes);

app.use('/api/transactions',transactionRoutes);

app.use(errorHandler);

module.exports = app;