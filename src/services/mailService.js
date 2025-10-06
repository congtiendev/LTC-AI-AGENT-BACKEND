const { createTransporter } = require('@/config/mail');
const { renderTemplate } = require('./emailTemplateService');
const nodemailer = require('nodemailer');
const logger = require('@/utils/logger');

/**
 * Send an email using configured transporter and compiled templates
 * @param {Object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} options.template - template name
 * @param {Object} options.context - template data
 */
const sendEmail = async ({ to, subject, template, context = {} }) => {
  let transporter;
  try {
    transporter = createTransporter();
  } catch (err) {
    logger.warn('createTransporter failed, falling back to ethereal test account', err.message);
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  // compile template to HTML
  const html = renderTemplate(template, context);

  const mailOptions = {
    from: process.env.MAIL_FROM_ADDRESS || process.env.MAIL_FROM || 'no-reply@kleverbot.ai',
    to,
    subject,
    html
  };

  const info = await transporter.sendMail(mailOptions);
  logger.info('Email sent: %s', info.messageId);

  // If using ethereal, provide preview URL
  if (nodemailer.getTestMessageUrl && process.env.NODE_ENV !== 'production') {
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) logger.info('Preview URL: %s', preview);
  }

  return info;
};

module.exports = {
  sendEmail
};
