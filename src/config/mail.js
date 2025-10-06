const nodemailer = require('nodemailer');

/**
 * Mail configuration and transporter factory.
 * Supports MAIL_DRIVER=gmail (uses MAIL_FROM_ADDRESS + MAIL_APP_PASSWORD)
 * Falls back to SMTP using MAIL_HOST/MAIL_PORT/MAIL_USER/MAIL_PASS
 */
const createTransporter = () => {
  const driver = (process.env.MAIL_DRIVER || 'smtp').toLowerCase();

  if (driver === 'gmail') {
    // For Gmail, prefer MAIL_FROM_ADDRESS as the auth user when using app passwords
    const user = process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USER;
    const pass = process.env.MAIL_APP_PASSWORD || process.env.MAIL_PASS;

    if (!user || !pass) {
      throw new Error('MAIL_DRIVER=gmail requires MAIL_FROM_ADDRESS and MAIL_APP_PASSWORD to be set');
    }

    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }
    });
  }

  // Default: generic SMTP
  const host = process.env.MAIL_HOST || 'localhost';
  const port = parseInt(process.env.MAIL_PORT, 10) || 587;
  const secure = process.env.MAIL_SECURE === 'true';
  const user = process.env.MAIL_USER || undefined;
  const pass = process.env.MAIL_PASS || undefined;

  const transportOptions = {
    host,
    port,
    secure
  };

  if (user && pass) transportOptions.auth = { user, pass };

  return nodemailer.createTransport(transportOptions);
};

module.exports = {
  createTransporter
};
