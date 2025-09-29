// =====================================================
// CORS MIDDLEWARE WITH ADVANCED SECURITY
// =====================================================

const cors = require('cors');
const logger = require('@/utils/logger');

// Development origins (can be multiple)
const developmentOrigins = [
  'http://localhost:3000',  // Frontend dev server
  'http://localhost:3001',  // Alternative frontend port
  'http://127.0.0.1:3000',  // Alternative localhost
  'http://127.0.0.1:3001'
];

// Production origins (from environment)
const productionOrigins = process.env.CORS_ORIGIN ? 
  process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : 
  [];

// Combine origins based on environment
const allowedOrigins = process.env.NODE_ENV === 'production' ? 
  productionOrigins : 
  [...developmentOrigins, ...productionOrigins];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      logger.debug('CORS: Request with no origin allowed');
      return callback(null, true);
    }

    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      logger.debug(`CORS: Origin ${origin} allowed`);
      callback(null, true);
    } else {
      logger.warn(`CORS: Origin ${origin} blocked`);
      const error = new Error(`Origin ${origin} not allowed by CORS policy`);
      error.status = 403;
      callback(error);
    }
  },

  // Allow credentials (cookies, authorization headers)
  credentials: process.env.CORS_CREDENTIALS !== 'false',

  // Allowed HTTP methods
  methods: [
    'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'
  ],

  // Allowed request headers
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Access-Token',
    'X-Refresh-Token'
  ],

  // Headers exposed to the client
  exposedHeaders: [
    'X-Total-Count',
    'X-Page-Count', 
    'X-Has-Next-Page',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset'
  ],

  // Preflight cache duration (24 hours)
  maxAge: 86400,

  // Handle preflight requests
  optionsSuccessStatus: 200
};

// Create CORS middleware
const corsMiddleware = cors(corsOptions);

// Enhanced CORS middleware with logging
const enhancedCORS = (req, res, next) => {
  // Log CORS requests in development
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`CORS Request: ${req.method} ${req.path} from ${req.get('Origin') || 'no-origin'}`);
  }

  corsMiddleware(req, res, next);
};

// CORS error handler
const corsErrorHandler = (err, req, res, next) => {
  if (err.message.includes('CORS')) {
    logger.error(`CORS Error: ${err.message} for origin: ${req.get('Origin')}`);
    return res.status(403).json({
      success: false,
      message: 'Cross-Origin Request Blocked',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  next(err);
};

module.exports = {
  corsMiddleware: enhancedCORS,
  corsErrorHandler,
  allowedOrigins
};
