const { validationResult } = require('express-validator');
const { createAndSendReset } = require('@/services/passwordResetService');
const ApiResponse = require('@/utils/responses');
const logger = require('@/utils/logger');

/**
 * Request password reset: create token and send email
 */
const requestReset = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return ApiResponse.badRequest(res, 'Validation failed', errors.array());
    }

    const { email } = req.body;
    await createAndSendReset(email);
    return ApiResponse.success(res, null, 'Password reset email sent');
  } catch (error) {
    logger.error('passwordResetController.requestReset error:', error);
    return ApiResponse.error(res, 'Failed to send password reset');
  }
};

module.exports = {
  requestReset
};
