// =====================================================
// ENVIRONMENT CONFIGURATION
// =====================================================

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT) || 8000,
  host: process.env.HOST || 'localhost',
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  // Database configuration
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    ssl: process.env.DB_SSL === 'true'
  },
  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },

  // CORS configuration
  cors: {
    origin: function (origin, callback) {
      const allowedOrigins = process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
        : ['http://localhost:3000', 'http://localhost:3001'];

      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS policy'));
      }
    },
    credentials: process.env.CORS_CREDENTIALS === 'true',
    methods: (process.env.CORS_METHODS || 'GET,POST,PUT,DELETE,OPTIONS').split(
      ','
    ),
    allowedHeaders: (
      process.env.CORS_ALLOWED_HEADERS ||
      'Content-Type,Authorization,X-Requested-With'
    ).split(','),
    exposedHeaders: (process.env.CORS_EXPOSED_HEADERS || 'X-Total-Count').split(
      ','
    ),
    maxAge: parseInt(process.env.CORS_MAX_AGE) || 86400 // 24 hours
  },

  // Security configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    sessionSecret: process.env.SESSION_SECRET
  },

  // Upload configuration
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5242880, // 5MB
    allowedTypes: (
      process.env.UPLOAD_ALLOWED_TYPES || 'jpg,jpeg,png,gif'
    ).split(',')
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 min
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    strictMax: parseInt(process.env.RATE_LIMIT_STRICT_MAX) || 20
  }
};
