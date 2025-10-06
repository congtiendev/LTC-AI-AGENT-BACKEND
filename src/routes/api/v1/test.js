const express = require('express');
const { testEmail } = require('@/controllers/testController');
const router = express.Router();

// Test endpoints - only for development
if (process.env.NODE_ENV === 'development' || process.env.DEBUG_MODE === 'true') {
  /**
   * @route POST /api/v1/test/email
   * @desc Test email sending functionality
   * @body { "to": "email@example.com", "template": "welcome" }
   */
  router.post('/email', testEmail);
}

module.exports = router;