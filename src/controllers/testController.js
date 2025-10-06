const { sendEmail } = require('@/services/mailService');
const ApiResponse = require('@/utils/responses');
const logger = require('@/utils/logger');

/**
 * Test email sending functionality
 */
const testEmail = async (req, res) => {
  try {
    const { to, template = 'welcome' } = req.body;
    
    if (!to) {
      return ApiResponse.badRequest(res, 'Email recipient is required');
    }

    logger.info(`Testing email send to: ${to}`);

    const result = await sendEmail({
      to,
      subject: 'Test Email from KleverBot API',
      template,
      context: {
        firstName: 'Test User',
        year: new Date().getFullYear(),
        resetUrl: 'https://example.com/reset-password',
        expiresIn: 60
      }
    });

    return ApiResponse.success(res, {
      messageId: result.messageId,
      to,
      template,
      preview: result.preview || null
    }, 'Test email sent successfully');

  } catch (error) {
    logger.error('TestController.testEmail error:', error);
    return ApiResponse.error(res, `Email test failed: ${error.message}`);
  }
};

module.exports = {
  testEmail
};