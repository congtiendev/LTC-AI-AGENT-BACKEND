/**
 * EmailController
 * Main controller for email sending and management operations
 */

const { validationResult } = require('express-validator');
const EmailModule = require('../EmailModule');
const ApiResponse = require('@/utils/responses');
const logger = require('@/utils/logger');

/**
 * Main Email Controller
 */
class EmailController {
  /**
   * Send single email
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async sendEmail(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.badRequest(res, 'Validation failed', errors.array());
      }

      const emailData = {
        ...req.body,
        userId: req.user?.id // Track who sent the email
      };

      const result = await EmailModule.sendEmail(emailData);

      logger.info('EmailController: Email sent successfully', {
        messageId: result.messageId,
        recipient: emailData.to,
        template: emailData.templateName,
        userId: req.user?.id
      });

      return ApiResponse.success(res, result, 'Email sent successfully');
    } catch (error) {
      logger.error('EmailController.sendEmail error:', error);

      if (error.message === 'RECIPIENT_REQUIRED') {
        return ApiResponse.badRequest(
          res,
          'Recipient email address is required'
        );
      }

      if (error.message === 'SUBJECT_REQUIRED') {
        return ApiResponse.badRequest(res, 'Email subject is required');
      }

      if (error.message === 'CONTENT_OR_TEMPLATE_REQUIRED') {
        return ApiResponse.badRequest(
          res,
          'Email content or template is required'
        );
      }

      if (error.message === 'INVALID_EMAIL_FORMAT') {
        return ApiResponse.badRequest(res, 'Invalid email address format');
      }

      if (error.message === 'RATE_LIMIT_EXCEEDED') {
        return ApiResponse.tooManyRequests(
          res,
          'Rate limit exceeded for this recipient'
        );
      }

      if (error.message.includes('TEMPLATE_NOT_FOUND')) {
        return ApiResponse.badRequest(res, 'Email template not found');
      }

      return ApiResponse.error(res, 'Failed to send email');
    }
  }

  /**
   * Send bulk emails
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async sendBulkEmails(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.badRequest(res, 'Validation failed', errors.array());
      }

      const { emails, options = {} } = req.body;

      if (!Array.isArray(emails) || emails.length === 0) {
        return ApiResponse.badRequest(
          res,
          'Emails array is required and cannot be empty'
        );
      }

      // Add userId to each email
      const emailsWithUser = emails.map(email => ({
        ...email,
        userId: req.user?.id
      }));

      const result = await EmailModule.sendBulkEmails(emailsWithUser, options);

      logger.info('EmailController: Bulk emails processed', {
        total: result.total,
        sent: result.sent,
        failed: result.failed,
        successRate: ((result.sent / result.total) * 100).toFixed(2) + '%',
        userId: req.user?.id
      });

      return ApiResponse.success(res, result, 'Bulk email sending completed');
    } catch (error) {
      logger.error('EmailController.sendBulkEmails error:', error);
      return ApiResponse.error(res, 'Failed to send bulk emails');
    }
  }

  /**
   * Queue email for later sending
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async queueEmail(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.badRequest(res, 'Validation failed', errors.array());
      }

      const emailData = {
        ...req.body,
        userId: req.user?.id
      };

      const result = await EmailModule.queueEmail(emailData);

      logger.info('EmailController: Email queued successfully', {
        queueId: result.queueId,
        recipient: emailData.to,
        scheduledAt: result.scheduledAt,
        userId: req.user?.id
      });

      return ApiResponse.success(res, result, 'Email queued successfully');
    } catch (error) {
      logger.error('EmailController.queueEmail error:', error);
      return ApiResponse.error(res, 'Failed to queue email');
    }
  }

  /**
   * Get email module statistics
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async getModuleStats(req, res) {
    try {
      const stats = await EmailModule.getModuleStatistics();

      return ApiResponse.success(
        res,
        stats,
        'Email module statistics retrieved successfully'
      );
    } catch (error) {
      logger.error('EmailController.getModuleStats error:', error);
      return ApiResponse.error(res, 'Failed to retrieve module statistics');
    }
  }

  /**
   * Test email configuration
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async testConfiguration(req, res) {
    try {
      const { testEmail } = req.body;

      if (!testEmail) {
        return ApiResponse.badRequest(res, 'Test email address is required');
      }

      const testEmailData = {
        to: testEmail,
        subject: 'Email Configuration Test',
        templateName: 'welcome',
        templateData: {
          name: 'Test User',
          appName: process.env.APP_NAME || 'KleverBot'
        },
        category: 'test',
        priority: 'normal',
        userId: req.user?.id
      };

      const result = await EmailModule.sendEmail(testEmailData);

      logger.info('EmailController: Configuration test completed', {
        messageId: result.messageId,
        testEmail,
        userId: req.user?.id
      });

      return ApiResponse.success(
        res,
        {
          success: true,
          messageId: result.messageId,
          testEmail,
          sentAt: result.sentAt
        },
        'Test email sent successfully'
      );
    } catch (error) {
      logger.error('EmailController.testConfiguration error:', error);
      return ApiResponse.error(
        res,
        'Email configuration test failed: ' + error.message
      );
    }
  }

  /**
   * Send notification email
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async sendNotification(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.badRequest(res, 'Validation failed', errors.array());
      }

      const { recipients, type, data = {}, priority = 'normal' } = req.body;

      if (!Array.isArray(recipients) || recipients.length === 0) {
        return ApiResponse.badRequest(res, 'Recipients array is required');
      }

      // Map notification types to templates
      const templateMap = {
        welcome: 'welcome',
        'password-reset': 'password-reset',
        'password-reset-success': 'password-reset-success',
        notification: 'notification'
      };

      const templateName = templateMap[type];
      if (!templateName) {
        return ApiResponse.badRequest(res, 'Invalid notification type');
      }

      // Create email data for each recipient
      const emails = recipients.map(recipient => ({
        to: typeof recipient === 'string' ? recipient : recipient.email,
        recipientName:
          typeof recipient === 'object' ? recipient.name : undefined,
        subject: this.generateNotificationSubject(type, data),
        templateName,
        templateData: {
          ...data,
          recipientName:
            typeof recipient === 'object' ? recipient.name : undefined
        },
        category: 'notification',
        priority,
        userId: req.user?.id
      }));

      const result = await EmailModule.sendBulkEmails(emails, {
        continueOnError: true,
        trackProgress: true
      });

      logger.info('EmailController: Notification emails sent', {
        type,
        totalRecipients: recipients.length,
        sent: result.sent,
        failed: result.failed,
        userId: req.user?.id
      });

      return ApiResponse.success(
        res,
        result,
        'Notification emails processed successfully'
      );
    } catch (error) {
      logger.error('EmailController.sendNotification error:', error);
      return ApiResponse.error(res, 'Failed to send notification emails');
    }
  }

  /**
   * Generate subject line for notification type
   * @private
   */
  generateNotificationSubject(type, data) {
    const appName = process.env.APP_NAME || 'KleverBot';

    const subjects = {
      welcome: `Welcome to ${appName}!`,
      'password-reset': `Password Reset Request - ${appName}`,
      'password-reset-success': `Password Reset Successful - ${appName}`,
      notification: data.subject || `Notification from ${appName}`
    };

    return subjects[type] || `Notification from ${appName}`;
  }

  /**
   * Get email sending quotas and limits
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async getQuotaInfo(req, res) {
    try {
      // This would typically come from your email service provider
      // For now, return configured limits
      const quotaInfo = {
        provider: EmailModule.getProviderName
          ? EmailModule.getProviderName()
          : 'smtp',
        limits: {
          perHour: EmailModule.config?.rateLimit?.maxEmails || 100,
          perDay: EmailModule.config?.dailyLimit || 1000,
          perMonth: EmailModule.config?.monthlyLimit || 10000
        },
        current: {
          // These would need to be calculated from email history
          hourly: 0,
          daily: 0,
          monthly: 0
        },
        resetTimes: {
          hourly: new Date(Date.now() + 3600000), // Next hour
          daily: new Date(Date.now() + 86400000), // Next day
          monthly: new Date(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            1
          ) // Next month
        }
      };

      return ApiResponse.success(
        res,
        quotaInfo,
        'Quota information retrieved successfully'
      );
    } catch (error) {
      logger.error('EmailController.getQuotaInfo error:', error);
      return ApiResponse.error(res, 'Failed to retrieve quota information');
    }
  }

  /**
   * Preview email before sending
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async previewEmail(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.badRequest(res, 'Validation failed', errors.array());
      }

      const { templateName, templateData = {}, renderOptions = {} } = req.body;

      if (!templateName) {
        return ApiResponse.badRequest(res, 'Template name is required');
      }

      const EmailTemplateService = require('../services/EmailTemplateService');

      const preview = await EmailTemplateService.previewTemplate(
        templateName,
        templateData
      );

      return ApiResponse.success(
        res,
        {
          templateName,
          preview,
          renderOptions
        },
        'Email preview generated successfully'
      );
    } catch (error) {
      logger.error('EmailController.previewEmail error:', error);

      if (error.message.includes('TEMPLATE_NOT_FOUND')) {
        return ApiResponse.notFound(res, 'Email template not found');
      }

      return ApiResponse.error(res, 'Failed to generate email preview');
    }
  }
}

module.exports = new EmailController();
