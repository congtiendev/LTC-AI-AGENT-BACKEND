/**
 * EmailModule - Main Email Management System
 * Comprehensive email management with sending, templates, history, queue, and analytics
 */

// const nodemailer = require('nodemailer'); // Already imported via mailConfig
const path = require('path');
const fs = require('fs').promises;

// Import email services
const EmailTemplateService = require('./services/EmailTemplateService');
const EmailHistoryService = require('./services/EmailHistoryService');
const EmailHistoryRepository = require('./repositories/EmailHistoryRepository');

// Import utilities
const logger = require('@/utils/logger');
const mailConfig = require('@/config/mail');

/**
 * Main EmailModule class - Central email management system
 */
class EmailModule {
  constructor() {
    this.transporter = null;
    this.isInitialized = false;
    this.config = {
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      queueEnabled: false,
      batchSize: 10,
      rateLimit: {
        maxEmails: 100,
        timeWindow: 3600000 // 1 hour in milliseconds
      }
    };

    this.emailQueue = [];
    this.processing = false;
    this.rateLimitTracker = new Map();
  }

  /**
   * Initialize the email module
   * @param {Object} options - Configuration options
   * @returns {Promise<void>}
   */
  async initialize(options = {}) {
    try {
      // Merge configuration
      this.config = { ...this.config, ...options };

      // Initialize email transporter
      await this.initializeTransporter();

      // Initialize template service
      await EmailTemplateService.initializeHandlebars();

      // Setup cleanup intervals
      this.setupCleanupTasks();

      // Setup queue processing if enabled
      if (this.config.queueEnabled) {
        this.setupQueueProcessing();
      }

      this.isInitialized = true;
      logger.info('EmailModule: Initialized successfully', {
        config: this.config,
        queueEnabled: this.config.queueEnabled
      });
    } catch (error) {
      logger.error('EmailModule.initialize error:', error);
      throw error;
    }
  }

  /**
   * Initialize email transporter
   * @private
   */
  async initializeTransporter() {
    try {
      this.transporter = mailConfig.createTransporter();

      // Verify transporter configuration
      await this.transporter.verify();

      logger.info('EmailModule: Transporter initialized and verified');
    } catch (error) {
      logger.error('EmailModule: Transporter initialization failed:', error);
      throw error;
    }
  }

  /**
   * Send email with comprehensive logging and error handling
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Send result with history record
   */
  async sendEmail(emailData) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const {
        to,
        cc,
        bcc,
        subject,
        templateName,
        templateData = {},
        htmlContent,
        textContent,
        attachments = [],
        priority = 'normal',
        category = 'general',
        userId,
        metadata = {},
        tags = [],
        scheduledAt,
        options = {}
      } = emailData;

      // Validate required fields
      this.validateEmailData(emailData);

      // Check rate limiting
      if (!this.checkRateLimit(to)) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }

      // Create email history record
      const historyRecord = await EmailHistoryService.createEmailRecord({
        recipient: to,
        recipientName: emailData.recipientName,
        subject,
        templateName,
        templateData,
        category,
        priority,
        provider: this.getProviderName(),
        userId,
        metadata,
        tags,
        scheduledAt
      });

      let finalHtmlContent = htmlContent;
      let finalTextContent = textContent;

      try {
        // Render template if specified
        if (templateName && !htmlContent) {
          const rendered = await EmailTemplateService.renderTemplate(
            templateName,
            templateData,
            options.templateOptions || {}
          );
          finalHtmlContent = rendered.html;
          finalTextContent = rendered.text;

          // Update history record with rendered content
          await EmailHistoryRepository.update(historyRecord.id, {
            htmlContent: finalHtmlContent,
            textContent: finalTextContent
          });
        }

        // Prepare email options
        const mailOptions = {
          from: emailData.from || process.env.MAIL_FROM_ADDRESS,
          to,
          cc,
          bcc,
          subject,
          html: finalHtmlContent,
          text: finalTextContent,
          attachments: await this.processAttachments(attachments),
          priority: this.mapPriorityToNodemailer(priority),
          headers: {
            'X-Email-Category': category,
            'X-Email-Priority': priority,
            'X-History-Id': historyRecord.id.toString(),
            ...options.headers
          }
        };

        // Add tracking pixels if enabled
        if (options.trackOpens) {
          mailOptions.html = this.addTrackingPixel(
            mailOptions.html,
            historyRecord.id
          );
        }

        // Send email
        const result = await this.transporter.sendMail(mailOptions);

        // Update history as sent
        await EmailHistoryService.markEmailAsSent(
          historyRecord.id,
          result.messageId,
          new Date()
        );

        // Update rate limit tracker
        this.updateRateLimit(to);

        logger.info('EmailModule: Email sent successfully', {
          historyId: historyRecord.id,
          messageId: result.messageId,
          recipient: to,
          template: templateName,
          category,
          priority
        });

        return {
          success: true,
          messageId: result.messageId,
          historyId: historyRecord.id,
          recipient: to,
          template: templateName,
          sentAt: new Date()
        };
      } catch (sendError) {
        // Mark email as failed
        await EmailHistoryService.markEmailAsFailed(
          historyRecord.id,
          sendError.message,
          sendError.code
        );

        logger.error('EmailModule: Email send failed', {
          historyId: historyRecord.id,
          recipient: to,
          error: sendError.message,
          template: templateName
        });

        // Add to retry queue if applicable
        if (
          this.shouldRetry(sendError) &&
          historyRecord.retryCount < this.config.maxRetries
        ) {
          await this.addToRetryQueue(historyRecord.id, emailData);
        }

        throw sendError;
      }
    } catch (error) {
      logger.error('EmailModule.sendEmail error:', error);
      throw error;
    }
  }

  /**
   * Send bulk emails with queue management
   * @param {Array} emailList - Array of email data objects
   * @param {Object} options - Bulk sending options
   * @returns {Promise<Object>} Bulk send results
   */
  async sendBulkEmails(emailList, options = {}) {
    try {
      const {
        batchSize = this.config.batchSize,
        delayBetweenBatches = 1000,
        continueOnError = true,
        trackProgress = false
      } = options;

      const results = {
        total: emailList.length,
        sent: 0,
        failed: 0,
        errors: [],
        details: []
      };

      logger.info('EmailModule: Starting bulk email send', {
        totalEmails: emailList.length,
        batchSize,
        continueOnError
      });

      // Process emails in batches
      for (let i = 0; i < emailList.length; i += batchSize) {
        const batch = emailList.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(
          batch.map((emailData, index) =>
            this.sendEmail(emailData).then(result => ({
              index: i + index,
              ...result
            }))
          )
        );

        // Process batch results
        batchResults.forEach((result, batchIndex) => {
          const emailIndex = i + batchIndex;

          if (result.status === 'fulfilled') {
            results.sent++;
            results.details.push({
              index: emailIndex,
              status: 'sent',
              messageId: result.value.messageId,
              historyId: result.value.historyId
            });
          } else {
            results.failed++;
            results.errors.push({
              index: emailIndex,
              error: result.reason.message,
              email: emailList[emailIndex].to
            });
            results.details.push({
              index: emailIndex,
              status: 'failed',
              error: result.reason.message
            });

            if (!continueOnError) {
              throw result.reason;
            }
          }
        });

        // Progress tracking
        if (trackProgress) {
          const progress = Math.round(
            ((i + batch.length) / emailList.length) * 100
          );
          logger.info(`EmailModule: Bulk send progress: ${progress}%`, {
            processed: i + batch.length,
            total: emailList.length,
            sent: results.sent,
            failed: results.failed
          });
        }

        // Delay between batches (except for the last batch)
        if (i + batchSize < emailList.length && delayBetweenBatches > 0) {
          await this.delay(delayBetweenBatches);
        }
      }

      logger.info('EmailModule: Bulk email send completed', {
        total: results.total,
        sent: results.sent,
        failed: results.failed,
        successRate: ((results.sent / results.total) * 100).toFixed(2) + '%'
      });

      return results;
    } catch (error) {
      logger.error('EmailModule.sendBulkEmails error:', error);
      throw error;
    }
  }

  /**
   * Add email to queue for later processing
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Queue result
   */
  async queueEmail(emailData) {
    try {
      if (!this.config.queueEnabled) {
        // If queue is disabled, send immediately
        return await this.sendEmail(emailData);
      }

      const queueItem = {
        id: Date.now() + Math.random(),
        emailData,
        attempts: 0,
        createdAt: new Date(),
        scheduledAt: emailData.scheduledAt || new Date()
      };

      this.emailQueue.push(queueItem);

      logger.info('EmailModule: Email added to queue', {
        queueId: queueItem.id,
        recipient: emailData.to,
        scheduledAt: queueItem.scheduledAt,
        queueSize: this.emailQueue.length
      });

      return {
        success: true,
        queueId: queueItem.id,
        queuePosition: this.emailQueue.length,
        scheduledAt: queueItem.scheduledAt
      };
    } catch (error) {
      logger.error('EmailModule.queueEmail error:', error);
      throw error;
    }
  }

  /**
   * Process email queue
   * @private
   */
  async processQueue() {
    if (this.processing || this.emailQueue.length === 0) {
      return;
    }

    this.processing = true;
    logger.debug('EmailModule: Processing email queue', {
      queueSize: this.emailQueue.length
    });

    try {
      const now = new Date();
      const readyEmails = this.emailQueue.filter(
        item =>
          item.scheduledAt <= now && item.attempts < this.config.maxRetries
      );

      for (const queueItem of readyEmails.slice(0, this.config.batchSize)) {
        try {
          await this.sendEmail(queueItem.emailData);

          // Remove from queue on success
          this.emailQueue = this.emailQueue.filter(
            item => item.id !== queueItem.id
          );
        } catch (error) {
          queueItem.attempts++;
          queueItem.lastError = error.message;
          queueItem.nextRetry = new Date(
            now.getTime() + this.config.retryDelay * queueItem.attempts
          );

          if (queueItem.attempts >= this.config.maxRetries) {
            // Remove failed items that exceeded max retries
            this.emailQueue = this.emailQueue.filter(
              item => item.id !== queueItem.id
            );
            logger.error(
              'EmailModule: Email removed from queue after max retries',
              {
                queueId: queueItem.id,
                attempts: queueItem.attempts,
                error: error.message
              }
            );
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Get email module statistics
   * @returns {Promise<Object>} Module statistics
   */
  async getModuleStatistics() {
    try {
      const emailStats = await EmailHistoryService.getEmailStatistics();
      const templateList = await EmailTemplateService.getTemplateList();

      return {
        emails: emailStats,
        templates: {
          total: templateList.length,
          categories: templateList.reduce((acc, template) => {
            acc[template.category] = (acc[template.category] || 0) + 1;
            return acc;
          }, {}),
          totalSize: templateList.reduce(
            (sum, template) => sum + template.size,
            0
          )
        },
        queue: {
          enabled: this.config.queueEnabled,
          pending: this.emailQueue.length,
          processing: this.processing
        },
        module: {
          initialized: this.isInitialized,
          provider: this.getProviderName(),
          config: {
            maxRetries: this.config.maxRetries,
            batchSize: this.config.batchSize,
            queueEnabled: this.config.queueEnabled
          }
        }
      };
    } catch (error) {
      logger.error('EmailModule.getModuleStatistics error:', error);
      throw error;
    }
  }

  /**
   * Validate email data
   * @private
   */
  validateEmailData(emailData) {
    const { to, subject } = emailData;

    if (!to) {
      throw new Error('RECIPIENT_REQUIRED');
    }

    if (!subject) {
      throw new Error('SUBJECT_REQUIRED');
    }

    if (
      !emailData.templateName &&
      !emailData.htmlContent &&
      !emailData.textContent
    ) {
      throw new Error('CONTENT_OR_TEMPLATE_REQUIRED');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      throw new Error('INVALID_EMAIL_FORMAT');
    }
  }

  /**
   * Check rate limiting
   * @private
   */
  checkRateLimit(email) {
    const now = Date.now();
    const windowStart = now - this.config.rateLimit.timeWindow;

    if (!this.rateLimitTracker.has(email)) {
      return true;
    }

    const timestamps = this.rateLimitTracker
      .get(email)
      .filter(time => time > windowStart);
    return timestamps.length < this.config.rateLimit.maxEmails;
  }

  /**
   * Update rate limit tracker
   * @private
   */
  updateRateLimit(email) {
    const now = Date.now();

    if (!this.rateLimitTracker.has(email)) {
      this.rateLimitTracker.set(email, []);
    }

    this.rateLimitTracker.get(email).push(now);
  }

  /**
   * Process attachments
   * @private
   */
  async processAttachments(attachments) {
    const processedAttachments = [];

    for (const attachment of attachments) {
      if (typeof attachment === 'string') {
        // File path
        const filePath = path.resolve(attachment);
        const content = await fs.readFile(filePath);
        processedAttachments.push({
          filename: path.basename(filePath),
          content
        });
      } else if (attachment.path) {
        // File object with path
        const content = await fs.readFile(attachment.path);
        processedAttachments.push({
          filename: attachment.filename || path.basename(attachment.path),
          content,
          contentType: attachment.contentType
        });
      } else {
        // Direct attachment object
        processedAttachments.push(attachment);
      }
    }

    return processedAttachments;
  }

  /**
   * Map priority to nodemailer format
   * @private
   */
  mapPriorityToNodemailer(priority) {
    const priorityMap = {
      low: 'low',
      normal: 'normal',
      high: 'high',
      urgent: 'high'
    };
    return priorityMap[priority] || 'normal';
  }

  /**
   * Add tracking pixel to HTML content
   * @private
   */
  addTrackingPixel(html, historyId) {
    const baseUrl = process.env.APP_URL || 'http://localhost:8000';
    const trackingUrl = `${baseUrl}/api/v1/email/track/open/${historyId}`;
    const trackingPixel = `<img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />`;

    return html.replace('</body>', `${trackingPixel}</body>`);
  }

  /**
   * Setup cleanup tasks
   * @private
   */
  setupCleanupTasks() {
    // Clean up rate limit tracker every hour
    setInterval(() => {
      const now = Date.now();
      const windowStart = now - this.config.rateLimit.timeWindow;

      for (const [email, timestamps] of this.rateLimitTracker) {
        const validTimestamps = timestamps.filter(time => time > windowStart);
        if (validTimestamps.length === 0) {
          this.rateLimitTracker.delete(email);
        } else {
          this.rateLimitTracker.set(email, validTimestamps);
        }
      }
    }, 3600000); // 1 hour

    // Clean up old email records (daily)
    setInterval(async () => {
      try {
        await EmailHistoryService.cleanupOldRecords(90); // Keep 90 days
      } catch (error) {
        logger.error('EmailModule: Cleanup task error:', error);
      }
    }, 86400000); // 24 hours
  }

  /**
   * Setup queue processing
   * @private
   */
  setupQueueProcessing() {
    // Process queue every minute
    setInterval(() => {
      this.processQueue().catch(error => {
        logger.error('EmailModule: Queue processing error:', error);
      });
    }, 60000); // 1 minute
  }

  /**
   * Check if error should trigger retry
   * @private
   */
  shouldRetry(error) {
    const retryableErrors = [
      'ETIMEDOUT',
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED'
    ];

    return retryableErrors.some(
      code => error.code === code || error.message.includes(code)
    );
  }

  /**
   * Add email to retry queue
   * @private
   */
  async addToRetryQueue(historyId, emailData) {
    setTimeout(async () => {
      try {
        await this.sendEmail(emailData);
      } catch (error) {
        logger.error('EmailModule: Retry failed', {
          historyId,
          error: error.message
        });
      }
    }, this.config.retryDelay);
  }

  /**
   * Get provider name
   * @private
   */
  getProviderName() {
    const driver = (process.env.MAIL_DRIVER || 'smtp').toLowerCase();
    return driver === 'gmail' ? 'gmail' : 'smtp';
  }

  /**
   * Utility delay function
   * @private
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('EmailModule: Shutting down...');

    // Process remaining queue items
    if (this.config.queueEnabled && this.emailQueue.length > 0) {
      logger.info(
        `EmailModule: Processing ${this.emailQueue.length} remaining queue items...`
      );
      await this.processQueue();
    }

    // Close transporter
    if (this.transporter) {
      this.transporter.close();
    }

    this.isInitialized = false;
    logger.info('EmailModule: Shutdown completed');
  }
}

// Export singleton instance
module.exports = new EmailModule();
