const express = require('express');
const stationRoutes = require('./routes/stationRoute');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const alertRoutes = require('./routes/alertRoutes');

const app = express();

app.use(express.json());

app.get('/health', (req , res) => {
  res.status(200).json({
    status: 'success',
    message: 'Ninety Gaming House API is healthy',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/stations', stationRoutes);

app.use('/api/auth', authRoutes);

app.use('/socket' , adminRoutes);

app.use('/api/alerts', alertRoutes);

app.use(errorHandler);

module.exports = app;