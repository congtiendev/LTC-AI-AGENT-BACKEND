// =====================================================
// KLEVERBOT BACKEND - MAIN ENTRY POINT
// =====================================================

// Initialize module aliases first
require('module-alias/register');

require('dotenv').config();
const app = require('@/app');
const logger = require('@/utils/logger');

const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || 'localhost';

// Start server
const server = app.listen(PORT, () => {
  logger.info(`KleverBot Backend Server running on http://${HOST}:${PORT}`);
  console.log(`🚀 KleverBot Backend Server running on http://${HOST}:${PORT}`);
  console.log(`📚 API Documentation: http://${HOST}:${PORT}/api/v1`);
  console.log(`🔍 Health Check: http://${HOST}:${PORT}/health`);
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Received shutdown signal, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
