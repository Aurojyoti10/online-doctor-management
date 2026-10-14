require('dotenv').config();

const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const pool = require('./config/database');
const doctorRoutes = require('./routes/doctorRoutes');
const patientRoutes = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/auth', authRoutes);
  
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Online Doctor Management System API is running',
  });
});

app.get('/api/health/db', async (req, res) => {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.ping();

    res.status(200).json({
      success: true,
      message: 'Database connected successfully',
    });
  } catch (error) {
    console.error('Database health check failed:', error.message);

    res.status(503).json({
      success: false,
      message: 'Database connection failed',
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
  });
});

module.exports = app;
