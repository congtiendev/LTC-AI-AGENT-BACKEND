// =====================================================
// DATABASE CONFIGURATION
// =====================================================

const { Sequelize } = require('sequelize');
const logger = require('@/utils/logger');

const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? 
    (msg) => logger.debug(msg) : false,
  pool: {
    min: parseInt(process.env.DB_POOL_MIN) || 5,
    max: parseInt(process.env.DB_POOL_MAX) || 20,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

// Test connection
sequelize.authenticate()
  .then(() => logger.info('✅ Database connected successfully'))
  .catch(err => logger.error('❌ Database connection failed:', err));

module.exports = { sequelize };
