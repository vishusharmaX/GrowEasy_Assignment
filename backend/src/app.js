const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const db = require('./config/db');
const importRoutes = require('./routes/import.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Configure CORS
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    // Always allow localhost for seamless developer testing
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }

    const allowedOrigin = env.CORS_ORIGIN;
    
    // Support wildcard or exact match
    if (allowedOrigin === '*' || allowedOrigin === origin) {
      return callback(null, true);
    }
    
    // Support comma-separated origins
    const originsList = allowedOrigin.split(',').map(o => o.trim());
    if (originsList.includes(origin)) {
      return callback(null, true);
    }
    
    // Disallow without throwing a 500 internal server error
    return callback(null, false);
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Liveness check for Render and orchestration platforms
app.get('/api/health', (req, res) => {
  const isDbConnected = db.getDbStatus();
  res.status(200).json({
    status: 'ok',
    timestamp: new Date(),
    environment: env.NODE_ENV,
    database: isDbConnected ? 'connected' : 'disconnected (degraded to in-memory)',
    llmProvider: env.LLM_PROVIDER
  });
});

// Import endpoints
app.use('/api/import', importRoutes);

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  const error = new Error(`Endpoint not found: ${req.method} ${req.url}`);
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  next(error);
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
