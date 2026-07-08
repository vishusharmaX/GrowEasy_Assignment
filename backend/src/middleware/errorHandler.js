const env = require('../config/env');

/**
 * Standardized API Error Handler Middleware.
 * Prevents stack trace leakage in production.
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  // Create unique request context if needed or log standard details
  const reqId = req.headers['x-request-id'] || 'N/A';
  console.error(`[Error] RequestID: ${reqId} | Route: ${req.method} ${req.url} | Status: ${statusCode} | Message: ${err.message}`);
  
  if (err.stack && env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Format consistent error response
  res.status(statusCode).json({
    error: {
      message: statusCode === 500 && env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred on the server.' 
        : err.message,
      code: err.code || 'INTERNAL_SERVER_ERROR',
      ...(env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;
