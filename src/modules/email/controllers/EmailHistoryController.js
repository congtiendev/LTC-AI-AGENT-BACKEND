/**
 * EmailHistoryController
 * Handles HTTP requests for email history management and analytics
 */

const { validationResult } = require('express-validator');
const EmailHistoryService = require('../services/EmailHistoryService');
const ApiResponse = require('@/utils/responses');
const logger = require('@/utils/logger');

/**
 * Controller for email history operations
 */
class EmailHistoryController {
  /**
   * Get email history with filters and pagination
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async getEmailHistory(req, res) {
    try {
      const {
        status,
        recipient,
        templateName,
        category,
        dateFrom,
        dateTo,
        priority,
        page = 1,
        limit = 20,
        orderBy = 'createdAt',
        orderDir = 'DESC',
        includeUser = false
      } = req.query;

      const filters = {
        status,
        recipient,
        templateName,
        category,
        priority,
        dateFrom,
        dateTo,
        userId: req.query.userId || req.user?.id // Filter by user if not admin
      };

      const pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        orderBy,
        orderDir,
        includeUser: includeUser === 'true'
      };

      const result = await EmailHistoryService.getEmailHistory(
        filters,
        pagination
      );

      return ApiResponse.success(
        res,
        result,
        'Email history retrieved successfully'
      );
    } catch (error) {
      logger.error('EmailHistoryController.getEmailHistory error:', error);
      return ApiResponse.error(res, 'Failed to retrieve email history');
    }
  }

  /**
   * Get specific email by ID
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async getEmailById(req, res) {
    try {
      const { id } = req.params;
      const { includeUser = false } = req.query;

      const email = await EmailHistoryService.getEmailById(
        parseInt(id),
        includeUser === 'true'
      );

      return ApiResponse.success(res, email, 'Email retrieved successfully');
    } catch (error) {
      logger.error('EmailHistoryController.getEmailById error:', error);

      if (error.message === 'EMAIL_NOT_FOUND') {
        return ApiResponse.notFound(res, 'Email not found');
      }

      return ApiResponse.error(res, 'Failed to retrieve email');
    }
  }

  /**
   * Get email statistics
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async getEmailStatistics(req, res) {
    try {
      const { startDate, endDate, category, templateName, userId } = req.query;

      const dateRange = {};
      if (startDate) dateRange.startDate = new Date(startDate);
      if (endDate) dateRange.endDate = new Date(endDate);

      const filters = { category, templateName, userId };

      const statistics = await EmailHistoryService.getEmailStatistics(
        dateRange,
        filters
      );

      return ApiResponse.success(
        res,
        statistics,
        'Email statistics retrieved successfully'
      );
    } catch (error) {
      logger.error('EmailHistoryController.getEmailStatistics error:', error);
      return ApiResponse.error(res, 'Failed to retrieve email statistics');
    }
  }

  /**
   * Search emails
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async searchEmails(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return ApiResponse.badRequest(res, 'Validation failed', errors.array());
      }

      const { q: searchTerm } = req.query;
      const {
        page = 1,
        limit = 20,
        searchIn = 'subject,recipient,templateName',
        status,
        category,
        dateFrom,
        dateTo
      } = req.query;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        searchIn: searchIn.split(','),
        status,
        category,
        dateFrom,
        dateTo
      };

      const results = await EmailHistoryService.searchEmails(
        searchTerm,
        options
      );

      return ApiResponse.success(
        res,
        results,
        'Email search completed successfully'
      );
    } catch (error) {
      logger.error('EmailHistoryController.searchEmails error:', error);
      return ApiResponse.error(res, 'Email search failed');
    }
  }

  /**
   * Get delivery report
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async getDeliveryReport(req, res) {
    try {
      const {
        dateFrom,
        dateTo,
        templateName,
        category,
        format = 'summary'
      } = req.query;

      const options = {
        dateFrom,
        dateTo,
        templateName,
        category,
        format
      };

      const report = await EmailHistoryService.generateDeliveryReport(options);

      return ApiResponse.success(
        res,
        report,
        'Delivery report generated successfully'
      );
    } catch (error) {
      logger.error('EmailHistoryController.getDeliveryReport error:', error);
      return ApiResponse.error(res, 'Failed to generate delivery report');
    }
  }

  /**
   * Get failed emails that can be retried
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async getRetryableEmails(req, res) {
    try {
      const { limit = 50 } = req.query;

      const emails = await EmailHistoryService.getRetryableEmails(
        parseInt(limit)
      );

      return ApiResponse.success(
        res,
        emails,
        'Retryable emails retrieved successfully'
      );
    } catch (error) {
      logger.error('EmailHistoryController.getRetryableEmails error:', error);
      return ApiResponse.error(res, 'Failed to retrieve retryable emails');
    }
  }

  /**
   * Retry failed email
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async retryEmail(req, res) {
    try {
      const { id } = req.params;

      // Get email record
      const email = await EmailHistoryService.getEmailById(parseInt(id));

      if (email.status !== 'failed') {
        return ApiResponse.badRequest(res, 'Email is not in failed status');
      }

      if (email.retryCount >= email.maxRetries) {
        return ApiResponse.badRequest(
          res,
          'Email has exceeded maximum retry attempts'
        );
      }

      // Import EmailModule to retry sending
      const EmailModule = require('../EmailModule');

      const emailData = {
        to: email.recipient,
        subject: email.subject,
        templateName: email.templateName,
        templateData: email.templateData,
        category: email.category,
        priority: email.priority,
        userId: email.userId
      };

      const result = await EmailModule.sendEmail(emailData);

      logger.info('EmailHistoryController: Email retried successfully', {
        originalId: id,
        newMessageId: result.messageId,
        userId: req.user?.id
      });

      return ApiResponse.success(
        res,
        result,
        'Email retry initiated successfully'
      );
    } catch (error) {
      logger.error('EmailHistoryController.retryEmail error:', error);

      if (error.message === 'EMAIL_NOT_FOUND') {
        return ApiResponse.notFound(res, 'Email not found');
      }

      return ApiResponse.error(res, 'Failed to retry email');
    }
  }

  /**
   * Clean up old email records
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async cleanupOldRecords(req, res) {
    try {
      const { daysToKeep = 90 } = req.body;

      const result = await EmailHistoryService.cleanupOldRecords(
        parseInt(daysToKeep)
      );

      logger.info('EmailHistoryController: Cleanup initiated', {
        daysToKeep,
        deletedCount: result.deletedCount,
        userId: req.user?.id
      });

      return ApiResponse.success(res, result, 'Cleanup completed successfully');
    } catch (error) {
      logger.error('EmailHistoryController.cleanupOldRecords error:', error);
      return ApiResponse.error(res, 'Failed to cleanup old records');
    }
  }

  /**
   * Track email open
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async trackEmailOpen(req, res) {
    try {
      const { id } = req.params;

      // Update email record with open timestamp
      const EmailHistoryRepository = require('../repositories/EmailHistoryRepository');

      await EmailHistoryRepository.update(parseInt(id), {
        openedAt: new Date()
      });

      logger.info('EmailHistoryController: Email open tracked', {
        emailId: id
      });

      // Return 1x1 transparent pixel
      const pixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'base64'
      );

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', pixel.length);
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      return res.send(pixel);
    } catch (error) {
      logger.error('EmailHistoryController.trackEmailOpen error:', error);

      // Still return pixel even on error to avoid broken images
      const pixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        'base64'
      );

      res.setHeader('Content-Type', 'image/png');
      return res.send(pixel);
    }
  }

  /**
   * Get email statistics dashboard data
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {Promise<import('express').Response>}
   */
  async getDashboardStats(req, res) {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Get statistics for different periods
      const [thirtyDayStats, sevenDayStats, todayStats, allTimeStats] =
        await Promise.all([
          EmailHistoryService.getEmailStatistics({
            startDate: thirtyDaysAgo,
            endDate: now
          }),
          EmailHistoryService.getEmailStatistics({
            startDate: sevenDaysAgo,
            endDate: now
          }),
          EmailHistoryService.getEmailStatistics({
            startDate: today,
            endDate: now
          }),
          EmailHistoryService.getEmailStatistics()
        ]);

      const dashboard = {
        overview: {
          allTime: {
            total: allTimeStats.overview.total || 0,
            sent: allTimeStats.overview.sent || 0,
            failed: allTimeStats.overview.failed || 0,
            successRate: allTimeStats.overview.successRate || 0
          },
          thirtyDays: {
            total: thirtyDayStats.overview.total || 0,
            sent: thirtyDayStats.overview.sent || 0,
            failed: thirtyDayStats.overview.failed || 0,
            successRate: thirtyDayStats.overview.successRate || 0
          },
          sevenDays: {
            total: sevenDayStats.overview.total || 0,
            sent: sevenDayStats.overview.sent || 0,
            failed: sevenDayStats.overview.failed || 0,
            successRate: sevenDayStats.overview.successRate || 0
          },
          today: {
            total: todayStats.overview.total || 0,
            sent: todayStats.overview.sent || 0,
            failed: todayStats.overview.failed || 0,
            successRate: todayStats.overview.successRate || 0
          }
        },
        charts: {
          daily: thirtyDayStats.daily || [],
          categories: thirtyDayStats.breakdown.categories || [],
          topTemplates: thirtyDayStats.topTemplates || []
        },
        lastUpdated: new Date()
      };

      return ApiResponse.success(
        res,
        dashboard,
        'Dashboard statistics retrieved successfully'
      );
    } catch (error) {
      logger.error('EmailHistoryController.getDashboardStats error:', error);
      return ApiResponse.error(res, 'Failed to retrieve dashboard statistics');
    }
  }
}

module.exports = new EmailHistoryController();
