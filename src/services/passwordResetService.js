const crypto = require('crypto');
const ms = require('ms');
const UserRepository = require('@/repositories/UserRepository');
const RefreshTokenRepository = require('@/repositories/RefreshTokenRepository');
const PasswordResetTokenRepository = require('@/repositories/PasswordResetTokenRepository');
const { sendEmail } = require('./mailService');
const logger = require('@/utils/logger');

/**
 * Create a password reset token and send email to user
 * @param {string} email
 */
const createAndSendReset = async email => {
  const user = await UserRepository.findByEmail(email);
  if (!user) throw new Error('USER_NOT_FOUND');

  // create token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await PasswordResetTokenRepository.create({
    userId: user.id,
    token,
    expiresAt
  });

  const resetUrl = `${process.env.FRONTEND_URL}/password-reset?token=${token}`;

  await sendEmail({
    to: user.email,
    subject: 'Password reset request',
    template: 'password-reset',
    context: { firstName: user.firstName || user.username, resetUrl, expiresIn: 60 }
  });

  logger.info(`Password reset email sent to ${user.email}`);
  return true;
};

module.exports = {
  createAndSendReset
};
