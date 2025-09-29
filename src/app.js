// =====================================================
// EXPRESS APP CONFIGURATION
// =====================================================

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

const config = require('@/config');
const routes = require('@/routes');
const { errorHandler } = require('@/middleware');
const { corsMiddleware, corsErrorHandler } = require('@/middleware/cors');
const logger = require('@/utils/logger');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));

// CORS middleware (must be before routes)
app.use(corsMiddleware);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use(config.apiPrefix, routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: require('../package.json').version
  });
});

// API root endpoint
app.get(config.apiPrefix, (req, res) => {
  res.json({
    name: 'KleverBot Backend API',
    version: require('../package.json').version,
    description: 'AI Agent Management Platform API',
    endpoints: {
      auth: `${config.apiPrefix}/auth`,
      users: `${config.apiPrefix}/users`,
      roles: `${config.apiPrefix}/roles`,
      profile: `${config.apiPrefix}/profile`
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Error handling middleware (must be last)
app.use(corsErrorHandler);
app.use(errorHandler);

module.exports = app;
