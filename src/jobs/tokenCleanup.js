const cron = require('node-cron');
const PasswordResetTokenRepository = require('@/repositories/PasswordResetTokenRepository');
const logger = require('@/utils/logger');

// Run cleanup every day at 02:00
cron.schedule('0 2 * * *', async () => {
  try {
    const deleted = await PasswordResetTokenRepository.deleteExpired();
    logger.info(`Password reset cleanup removed ${deleted} records`);
  } catch (error) {
    logger.error('tokenCleanup error:', error);
  }
});

module.exports = cron;
