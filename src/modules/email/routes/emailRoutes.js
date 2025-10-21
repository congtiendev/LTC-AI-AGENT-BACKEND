/**
 * Email Module Routes
 * Comprehensive routing for email management system
 */

const express = require('express');
const { auth } = require('@/middleware');
const { createRateLimiter } = require('@/middleware/rateLimiter');

// Controllers
const EmailController = require('../controllers/EmailController');
const EmailTemplateController = require('../controllers/EmailTemplateController');
const EmailHistoryController = require('../controllers/EmailHistoryController');

// Validators
const {
  sendEmailValidator,
  sendBulkEmailsValidator,
  queueEmailValidator,
  sendNotificationValidator,
  createTemplateValidator,
  updateTemplateValidator,
  testTemplateValidator,
  validateTemplateValidator,
  emailHistoryQueryValidator,
  emailSearchValidator,
  testConfigurationValidator,
  cleanupValidator,
  previewEmailValidator
} = require('../validators/emailValidators');

const router = express.Router();

// =====================================================
// EMAIL SENDING ROUTES
// =====================================================

/**
 * @route   POST /api/v1/email/send
 * @desc    Send single email
 * @access  Private
 */
router.post(
  '/send',
  auth,
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 50 }), // 50 emails per 15 minutes
  sendEmailValidator,
  EmailController.sendEmail
);

/**
 * @route   POST /api/v1/email/send/bulk
 * @desc    Send bulk emails
 * @access  Private
 */
router.post(
  '/send/bulk',
  auth,
  createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5 }), // 5 bulk operations per hour
  sendBulkEmailsValidator,
  EmailController.sendBulkEmails
);

/**
 * @route   POST /api/v1/email/queue
 * @desc    Queue email for later sending
 * @access  Private
 */
router.post(
  '/queue',
  auth,
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }), // 100 queued emails per 15 minutes
  queueEmailValidator,
  EmailController.queueEmail
);

/**
 * @route   POST /api/v1/email/notification
 * @desc    Send notification emails
 * @access  Private
 */
router.post(
  '/notification',
  auth,
  createRateLimiter({ windowMs: 60 * 60 * 1000, max: 10 }), // 10 notification batches per hour
  sendNotificationValidator,
  EmailController.sendNotification
);

/**
 * @route   POST /api/v1/email/preview
 * @desc    Preview email before sending
 * @access  Private
 */
router.post(
  '/preview',
  auth,
  previewEmailValidator,
  EmailController.previewEmail
);

// =====================================================
// EMAIL TEMPLATE ROUTES
// =====================================================

/**
 * @route   GET /api/v1/email/templates
 * @desc    Get all email templates
 * @access  Private
 */
router.get('/templates', auth, EmailTemplateController.getTemplates);

/**
 * @route   GET /api/v1/email/templates/stats
 * @desc    Get template statistics
 * @access  Private
 */
router.get('/templates/stats', auth, EmailTemplateController.getTemplateStats);

/**
 * @route   GET /api/v1/email/templates/:name
 * @desc    Get specific template
 * @access  Private
 */
router.get('/templates/:name', auth, EmailTemplateController.getTemplate);

/**
 * @route   POST /api/v1/email/templates
 * @desc    Create new template
 * @access  Private
 */
router.post(
  '/templates',
  auth,
  createTemplateValidator,
  EmailTemplateController.createTemplate
);

/**
 * @route   PUT /api/v1/email/templates/:name
 * @desc    Update template
 * @access  Private
 */
router.put(
  '/templates/:name',
  auth,
  updateTemplateValidator,
  EmailTemplateController.updateTemplate
);

/**
 * @route   DELETE /api/v1/email/templates/:name
 * @desc    Delete template
 * @access  Private
 */
router.delete('/templates/:name', auth, EmailTemplateController.deleteTemplate);

/**
 * @route   POST /api/v1/email/templates/:name/preview
 * @desc    Preview template with sample data
 * @access  Private
 */
router.post(
  '/templates/:name/preview',
  auth,
  EmailTemplateController.previewTemplate
);

/**
 * @route   GET /api/v1/email/templates/:name/render
 * @desc    Render template as HTML
 * @access  Private
 */
router.get(
  '/templates/:name/render',
  auth,
  EmailTemplateController.renderTemplateHtml
);

/**
 * @route   POST /api/v1/email/templates/:name/test
 * @desc    Test template rendering
 * @access  Private
 */
router.post(
  '/templates/:name/test',
  auth,
  testTemplateValidator,
  EmailTemplateController.testTemplate
);

/**
 * @route   POST /api/v1/email/templates/validate
 * @desc    Validate template syntax
 * @access  Private
 */
router.post(
  '/templates/validate',
  auth,
  validateTemplateValidator,
  EmailTemplateController.validateTemplate
);

/**
 * @route   DELETE /api/v1/email/templates/:name/cache
 * @desc    Clear template cache
 * @access  Private
 */
router.delete(
  '/templates/:name/cache',
  auth,
  EmailTemplateController.clearCache
);

/**
 * @route   DELETE /api/v1/email/templates/cache
 * @desc    Clear all template cache
 * @access  Private
 */
router.delete('/templates/cache', auth, EmailTemplateController.clearCache);

// =====================================================
// EMAIL HISTORY ROUTES
// =====================================================

/**
 * @route   GET /api/v1/email/history
 * @desc    Get email history with filters
 * @access  Private
 */
router.get(
  '/history',
  auth,
  emailHistoryQueryValidator,
  EmailHistoryController.getEmailHistory
);

/**
 * @route   GET /api/v1/email/history/search
 * @desc    Search email history
 * @access  Private
 */
router.get(
  '/history/search',
  auth,
  emailSearchValidator,
  EmailHistoryController.searchEmails
);

/**
 * @route   GET /api/v1/email/history/stats
 * @desc    Get email statistics
 * @access  Private
 */
router.get('/history/stats', auth, EmailHistoryController.getEmailStatistics);

/**
 * @route   GET /api/v1/email/history/dashboard
 * @desc    Get dashboard statistics
 * @access  Private
 */
router.get(
  '/history/dashboard',
  auth,
  EmailHistoryController.getDashboardStats
);

/**
 * @route   GET /api/v1/email/history/report
 * @desc    Generate delivery report
 * @access  Private
 */
router.get('/history/report', auth, EmailHistoryController.getDeliveryReport);

/**
 * @route   GET /api/v1/email/history/retryable
 * @desc    Get retryable failed emails
 * @access  Private
 */
router.get(
  '/history/retryable',
  auth,
  EmailHistoryController.getRetryableEmails
);

/**
 * @route   GET /api/v1/email/history/:id
 * @desc    Get specific email by ID
 * @access  Private
 */
router.get('/history/:id', auth, EmailHistoryController.getEmailById);

/**
 * @route   POST /api/v1/email/history/:id/retry
 * @desc    Retry failed email
 * @access  Private
 */
router.post(
  '/history/:id/retry',
  auth,
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 retries per 15 minutes
  EmailHistoryController.retryEmail
);

/**
 * @route   POST /api/v1/email/history/cleanup
 * @desc    Clean up old email records
 * @access  Private
 */
router.post(
  '/history/cleanup',
  auth,
  cleanupValidator,
  EmailHistoryController.cleanupOldRecords
);

// =====================================================
// EMAIL TRACKING ROUTES
// =====================================================

/**
 * @route   GET /api/v1/email/track/open/:id
 * @desc    Track email open (pixel tracking)
 * @access  Public (for email tracking)
 */
router.get('/track/open/:id', EmailHistoryController.trackEmailOpen);

// =====================================================
// EMAIL MODULE MANAGEMENT ROUTES
// =====================================================

/**
 * @route   GET /api/v1/email/stats
 * @desc    Get email module statistics
 * @access  Private
 */
router.get('/stats', auth, EmailController.getModuleStats);

/**
 * @route   GET /api/v1/email/quota
 * @desc    Get email sending quotas and limits
 * @access  Private
 */
router.get('/quota', auth, EmailController.getQuotaInfo);

/**
 * @route   POST /api/v1/email/test
 * @desc    Test email configuration
 * @access  Private
 */
router.post(
  '/test',
  auth,
  createRateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }), // 5 test emails per 15 minutes
  testConfigurationValidator,
  EmailController.testConfiguration
);

// =====================================================
// HEALTH CHECK
// =====================================================

/**
 * @route   GET /api/v1/email/health
 * @desc    Email module health check
 * @access  Private
 */
router.get('/health', auth, async (req, res) => {
  try {
    const EmailModule = require('../EmailModule');

    const health = {
      status: 'healthy',
      timestamp: new Date(),
      module: {
        initialized: EmailModule.isInitialized,
        queueEnabled: EmailModule.config?.queueEnabled || false,
        provider: EmailModule.getProviderName
          ? EmailModule.getProviderName()
          : 'unknown'
      },
      services: {
        templates: 'available',
        history: 'available',
        transporter: EmailModule.transporter ? 'connected' : 'disconnected'
      }
    };

    res.json({
      success: true,
      data: health,
      message: 'Email module is healthy'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Email module health check failed',
      error: error.message
    });
  }
});

module.exports = router;
