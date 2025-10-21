/**
 * Email Validators
 * Validation schemas for email module endpoints
 */

const { body, query, param } = require('express-validator');

/**
 * Send email validation
 */
const sendEmailValidator = [
  body('to')
    .isEmail()
    .withMessage('Valid recipient email is required')
    .normalizeEmail(),

  body('subject')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Subject is required and must be less than 500 characters'),

  body('templateName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Template name must be less than 100 characters'),

  body('templateData')
    .optional()
    .isObject()
    .withMessage('Template data must be an object'),

  body('htmlContent')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('HTML content cannot be empty if provided'),

  body('textContent')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Text content cannot be empty if provided'),

  body('cc')
    .optional()
    .custom(value => {
      if (Array.isArray(value)) {
        return value.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      }
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    })
    .withMessage('All CC emails must be valid'),

  body('bcc')
    .optional()
    .custom(value => {
      if (Array.isArray(value)) {
        return value.every(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
      }
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    })
    .withMessage('All BCC emails must be valid'),

  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, normal, high, urgent'),

  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category must be less than 100 characters'),

  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid ISO 8601 date'),

  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),

  body('recipientName')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Recipient name must be less than 255 characters'),

  body('from')
    .optional()
    .isEmail()
    .withMessage('From email must be valid')
    .normalizeEmail()
];

/**
 * Bulk email validation
 */
const sendBulkEmailsValidator = [
  body('emails')
    .isArray({ min: 1, max: 100 })
    .withMessage('Emails array is required and must contain 1-100 items'),

  body('emails.*.to')
    .isEmail()
    .withMessage('Each email must have a valid recipient')
    .normalizeEmail(),

  body('emails.*.subject')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Each email must have a subject less than 500 characters'),

  body('options.batchSize')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Batch size must be between 1 and 50'),

  body('options.delayBetweenBatches')
    .optional()
    .isInt({ min: 0, max: 10000 })
    .withMessage('Delay between batches must be between 0 and 10000ms'),

  body('options.continueOnError')
    .optional()
    .isBoolean()
    .withMessage('Continue on error must be a boolean')
];

/**
 * Queue email validation
 */
const queueEmailValidator = [
  ...sendEmailValidator,

  body('scheduledAt')
    .optional()
    .isISO8601()
    .custom(value => {
      const scheduledTime = new Date(value);
      const now = new Date();
      return scheduledTime > now;
    })
    .withMessage('Scheduled time must be in the future')
];

/**
 * Send notification validation
 */
const sendNotificationValidator = [
  body('recipients')
    .isArray({ min: 1, max: 1000 })
    .withMessage('Recipients array is required and must contain 1-1000 items'),

  body('recipients.*')
    .custom(value => {
      if (typeof value === 'string') {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }
      if (typeof value === 'object' && value.email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email);
      }
      return false;
    })
    .withMessage(
      'Each recipient must be a valid email or object with email property'
    ),

  body('type')
    .isIn([
      'welcome',
      'password-reset',
      'password-reset-success',
      'notification'
    ])
    .withMessage(
      'Type must be one of: welcome, password-reset, password-reset-success, notification'
    ),

  body('data').optional().isObject().withMessage('Data must be an object'),

  body('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, normal, high, urgent')
];

/**
 * Template validation
 */
const createTemplateValidator = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      'Template name is required, max 100 chars, alphanumeric, underscore, and dash only'
    ),

  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Template content is required'),

  body('metadata.description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),

  body('metadata.category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters'),

  body('metadata.author')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Author must be less than 100 characters')
];

/**
 * Template update validation
 */
const updateTemplateValidator = [
  param('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage(
      'Template name is required, max 100 chars, alphanumeric, underscore, and dash only'
    ),

  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Template content is required'),

  body('metadata.description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),

  body('metadata.category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters')
];

/**
 * Template test validation
 */
const testTemplateValidator = [
  param('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Template name is required'),

  body('data').optional().isObject().withMessage('Test data must be an object'),

  body('options').optional().isObject().withMessage('Options must be an object')
];

/**
 * Template validation syntax
 */
const validateTemplateValidator = [
  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Template content is required')
];

/**
 * Email history query validation
 */
const emailHistoryQueryValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('status')
    .optional()
    .isIn(['pending', 'sent', 'failed', 'bounced', 'delivered'])
    .withMessage(
      'Status must be one of: pending, sent, failed, bounced, delivered'
    ),

  query('recipient')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Recipient filter cannot be empty'),

  query('templateName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Template name filter must be less than 100 characters'),

  query('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category filter must be less than 100 characters'),

  query('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, normal, high, urgent'),

  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Date from must be a valid ISO 8601 date'),

  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Date to must be a valid ISO 8601 date'),

  query('orderBy')
    .optional()
    .isIn(['createdAt', 'sentAt', 'status', 'recipient', 'subject'])
    .withMessage(
      'Order by must be one of: createdAt, sentAt, status, recipient, subject'
    ),

  query('orderDir')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Order direction must be ASC or DESC')
];

/**
 * Email search validation
 */
const emailSearchValidator = [
  query('q')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage(
      'Search query is required and must be less than 255 characters'
    ),

  query('searchIn')
    .optional()
    .custom(value => {
      const validFields = [
        'subject',
        'recipient',
        'recipientName',
        'templateName'
      ];
      const fields = value.split(',');
      return fields.every(field => validFields.includes(field.trim()));
    })
    .withMessage(
      'Search fields must be comma-separated list of: subject, recipient, recipientName, templateName'
    ),

  ...emailHistoryQueryValidator.filter(
    validator => !validator.toString().includes("query('q')")
  )
];

/**
 * Test configuration validation
 */
const testConfigurationValidator = [
  body('testEmail')
    .isEmail()
    .withMessage('Valid test email address is required')
    .normalizeEmail()
];

/**
 * Cleanup validation
 */
const cleanupValidator = [
  body('daysToKeep')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days to keep must be between 1 and 365')
];

/**
 * Preview email validation
 */
const previewEmailValidator = [
  body('templateName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage(
      'Template name is required and must be less than 100 characters'
    ),

  body('templateData')
    .optional()
    .isObject()
    .withMessage('Template data must be an object'),

  body('renderOptions')
    .optional()
    .isObject()
    .withMessage('Render options must be an object')
];

module.exports = {
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
};
