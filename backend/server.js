require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');
const errorHandler = require('./src/middlewares/errorHandler');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const departmentRoutes = require('./src/routes/departmentRoutes');
const patientRoutes = require('./src/routes/patientRoutes');
const doctorRoutes = require('./src/routes/doctorRoutes');
const appointmentRoutes = require('./src/routes/appointmentRoutes');
const medicalRecordRoutes = require('./src/routes/medicalRecordRoutes');
const prescriptionRoutes = require('./src/routes/prescriptionRoutes');
const pharmacyRoutes = require('./src/routes/pharmacyRoutes');

// Connect to Database
connectDB();

const app = express();

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/v1/auth/login', authLimiter);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP Request Logger
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  );
}

// Health Check API
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'Smart Healthcare & Hospital Management System API',
    status: 'HEALTHY',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/medical-records', medicalRecordRoutes);
app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/v1/pharmacy', pharmacyRoutes);

// Handle Undefined Routes (404)
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' does not exist on this server.`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Healthcare Backend API running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Promise Rejection: ${err.message}`, { stack: err.stack });
  server.close(() => process.exit(1));
});

module.exports = app;
