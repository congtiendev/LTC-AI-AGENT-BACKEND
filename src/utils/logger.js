// =====================================================
// WINSTON LOGGER CONFIGURATION
// =====================================================

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: parseInt(process.env.LOG_MAX_SIZE) || 10485760, // 10MB
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
    }),
    // Combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      maxsize: parseInt(process.env.LOG_MAX_SIZE) || 10485760, // 10MB
      maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
