/**
 * EmailHistoryService
 * Business logic for email history management, analytics, and reporting
 */

const EmailHistoryRepository = require('../repositories/EmailHistoryRepository');
const logger = require('@/utils/logger');

/**
 * Service for managing email history and analytics
 */
class EmailHistoryService {
  /**
   * Create a new email history record
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Created email history record
   */
  async createEmailRecord(emailData) {
    try {
      const record = await EmailHistoryRepository.createEmailRecord({
        recipient: emailData.recipient,
        recipientName: emailData.recipientName,
        subject: emailData.subject,
        templateName: emailData.templateName,
        templateData: emailData.templateData,
        htmlContent: emailData.htmlContent,
        textContent: emailData.textContent,
        category: emailData.category || 'general',
        priority: emailData.priority || 'normal',
        provider: emailData.provider || 'smtp',
        userId: emailData.userId,
        metadata: emailData.metadata,
        tags: emailData.tags,
        scheduledAt: emailData.scheduledAt || new Date()
      });

      logger.info('EmailHistoryService: Created email record', {
        id: record.id,
        recipient: record.recipient,
        template: record.templateName
      });

      return record;
    } catch (error) {
      logger.error('EmailHistoryService.createEmailRecord error:', error);
      throw error;
    }
  }

  /**
   * Mark email as successfully sent
   * @param {number} emailId - Email history ID
   * @param {string} messageId - SMTP message ID
   * @param {Date} [sentAt] - Sent timestamp
   * @returns {Promise<Object>} Updated record
   */
  async markEmailAsSent(emailId, messageId, sentAt = new Date()) {
    try {
      const record = await EmailHistoryRepository.markAsSent(
        emailId,
        messageId,
        sentAt
      );

      logger.info('EmailHistoryService: Email marked as sent', {
        emailId,
        messageId,
        recipient: record.recipient
      });

      return record;
    } catch (error) {
      logger.error('EmailHistoryService.markEmailAsSent error:', error);
      throw error;
    }
  }

  /**
   * Mark email as failed
   * @param {number} emailId - Email history ID
   * @param {string} errorMessage - Error message
   * @param {string} [errorCode] - Error code
   * @returns {Promise<Object>} Updated record
   */
  async markEmailAsFailed(emailId, errorMessage, errorCode = null) {
    try {
      const record = await EmailHistoryRepository.markAsFailed(
        emailId,
        errorMessage,
        errorCode
      );

      logger.warn('EmailHistoryService: Email marked as failed', {
        emailId,
        errorMessage,
        errorCode,
        recipient: record.recipient,
        retryCount: record.retryCount
      });

      return record;
    } catch (error) {
      logger.error('EmailHistoryService.markEmailAsFailed error:', error);
      throw error;
    }
  }

  /**
   * Get email history with filters and pagination
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Paginated email history
   */
  async getEmailHistory(filters = {}, pagination = {}) {
    try {
      const {
        status,
        recipient,
        templateName,
        category,
        userId,
        dateFrom,
        dateTo,
        priority
      } = filters;

      const {
        page = 1,
        limit = 20,
        orderBy = 'createdAt',
        orderDir = 'DESC',
        includeUser = false
      } = pagination;

      const whereClause = {};

      // Apply filters
      if (status) {
        whereClause.status = status;
      }

      if (recipient) {
        whereClause.recipient = {
          [EmailHistoryRepository.model.sequelize.Sequelize.Op.iLike]:
            `%${recipient}%`
        };
      }

      if (templateName) {
        whereClause.templateName = templateName;
      }

      if (category) {
        whereClause.category = category;
      }

      if (userId) {
        whereClause.userId = userId;
      }

      if (priority) {
        whereClause.priority = priority;
      }

      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) {
          whereClause.createdAt[
            EmailHistoryRepository.model.sequelize.Sequelize.Op.gte
          ] = new Date(dateFrom);
        }
        if (dateTo) {
          whereClause.createdAt[
            EmailHistoryRepository.model.sequelize.Sequelize.Op.lte
          ] = new Date(dateTo);
        }
      }

      const result = await EmailHistoryRepository.findAllWithPagination({
        where: whereClause,
        page,
        limit,
        orderBy,
        orderDir,
        include: includeUser
          ? [
              {
                association: 'user',
                attributes: ['id', 'username', 'email', 'firstName', 'lastName']
              }
            ]
          : []
      });

      logger.debug('EmailHistoryService: Retrieved email history', {
        filters,
        totalRecords: result.totalRecords,
        page,
        limit
      });

      return result;
    } catch (error) {
      logger.error('EmailHistoryService.getEmailHistory error:', error);
      throw error;
    }
  }

  /**
   * Get email by ID
   * @param {number} emailId - Email history ID
   * @param {boolean} [includeUser=false] - Include user data
   * @returns {Promise<Object>} Email record
   */
  async getEmailById(emailId, includeUser = false) {
    try {
      const include = includeUser
        ? [
            {
              association: 'user',
              attributes: ['id', 'username', 'email', 'firstName', 'lastName']
            }
          ]
        : [];

      const email = await EmailHistoryRepository.findById(emailId, { include });

      if (!email) {
        throw new Error('EMAIL_NOT_FOUND');
      }

      return email;
    } catch (error) {
      logger.error('EmailHistoryService.getEmailById error:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive email statistics
   * @param {Object} dateRange - Date range for statistics
   * @param {Object} filters - Additional filters
   * @returns {Promise<Object>} Email statistics
   */
  async getEmailStatistics(dateRange = {}, filters = {}) {
    try {
      const { startDate, endDate } = dateRange;
      const { category, templateName, userId } = filters;

      // Basic statistics
      const basicStats = await EmailHistoryRepository.getStatistics(dateRange);

      // Additional filters for detailed stats
      const whereClause = {};

      if (startDate && endDate) {
        whereClause.createdAt = {
          [EmailHistoryRepository.model.sequelize.Sequelize.Op.between]: [
            startDate,
            endDate
          ]
        };
      }

      if (category) whereClause.category = category;
      if (templateName) whereClause.templateName = templateName;
      if (userId) whereClause.userId = userId;

      // Category breakdown
      const categoryStats = await EmailHistoryRepository.model.findAll({
        where: whereClause,
        attributes: [
          'category',
          [
            EmailHistoryRepository.model.sequelize.fn(
              'count',
              EmailHistoryRepository.model.sequelize.col('id')
            ),
            'count'
          ],
          [
            EmailHistoryRepository.model.sequelize.fn(
              'count',
              EmailHistoryRepository.model.sequelize.literal(
                "CASE WHEN status = 'sent' THEN 1 END"
              )
            ),
            'sent_count'
          ]
        ],
        group: ['category'],
        order: [
          [EmailHistoryRepository.model.sequelize.literal('count'), 'DESC']
        ],
        raw: true
      });

      // Priority breakdown
      const priorityStats = await EmailHistoryRepository.model.findAll({
        where: whereClause,
        attributes: [
          'priority',
          [
            EmailHistoryRepository.model.sequelize.fn(
              'count',
              EmailHistoryRepository.model.sequelize.col('id')
            ),
            'count'
          ]
        ],
        group: ['priority'],
        raw: true
      });

      // Provider breakdown
      const providerStats = await EmailHistoryRepository.model.findAll({
        where: whereClause,
        attributes: [
          'provider',
          [
            EmailHistoryRepository.model.sequelize.fn(
              'count',
              EmailHistoryRepository.model.sequelize.col('id')
            ),
            'count'
          ],
          [
            EmailHistoryRepository.model.sequelize.fn(
              'count',
              EmailHistoryRepository.model.sequelize.literal(
                "CASE WHEN status = 'sent' THEN 1 END"
              )
            ),
            'sent_count'
          ]
        ],
        group: ['provider'],
        raw: true
      });

      // Daily statistics (last 30 days or date range)
      const dailyStatsEndDate = endDate ? new Date(endDate) : new Date();
      const dailyStatsStartDate = startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const dailyStats = await EmailHistoryRepository.model.findAll({
        where: {
          ...whereClause,
          createdAt: {
            [EmailHistoryRepository.model.sequelize.Sequelize.Op.between]: [
              dailyStatsStartDate,
              dailyStatsEndDate
            ]
          }
        },
        attributes: [
          [
            EmailHistoryRepository.model.sequelize.fn(
              'DATE',
              EmailHistoryRepository.model.sequelize.col('createdAt')
            ),
            'date'
          ],
          [
            EmailHistoryRepository.model.sequelize.fn(
              'count',
              EmailHistoryRepository.model.sequelize.col('id')
            ),
            'total'
          ],
          [
            EmailHistoryRepository.model.sequelize.fn(
              'count',
              EmailHistoryRepository.model.sequelize.literal(
                "CASE WHEN status = 'sent' THEN 1 END"
              )
            ),
            'sent'
          ],
          [
            EmailHistoryRepository.model.sequelize.fn(
              'count',
              EmailHistoryRepository.model.sequelize.literal(
                "CASE WHEN status = 'failed' THEN 1 END"
              )
            ),
            'failed'
          ]
        ],
        group: [
          EmailHistoryRepository.model.sequelize.fn(
            'DATE',
            EmailHistoryRepository.model.sequelize.col('createdAt')
          )
        ],
        order: [
          [
            EmailHistoryRepository.model.sequelize.fn(
              'DATE',
              EmailHistoryRepository.model.sequelize.col('createdAt')
            ),
            'ASC'
          ]
        ],
        raw: true
      });

      // Top templates
      const topTemplates = await EmailHistoryRepository.getTopTemplates(
        10,
        dateRange
      );

      const statistics = {
        overview: basicStats,
        breakdown: {
          categories: categoryStats.map(stat => ({
            category: stat.category || 'uncategorized',
            total: parseInt(stat.count),
            sent: parseInt(stat.sent_count || 0),
            successRate:
              stat.count > 0
                ? (
                    (parseFloat(stat.sent_count || 0) /
                      parseFloat(stat.count)) *
                    100
                  ).toFixed(2)
                : 0
          })),
          priorities: priorityStats.map(stat => ({
            priority: stat.priority,
            count: parseInt(stat.count)
          })),
          providers: providerStats.map(stat => ({
            provider: stat.provider || 'unknown',
            total: parseInt(stat.count),
            sent: parseInt(stat.sent_count || 0),
            successRate:
              stat.count > 0
                ? (
                    (parseFloat(stat.sent_count || 0) /
                      parseFloat(stat.count)) *
                    100
                  ).toFixed(2)
                : 0
          }))
        },
        daily: dailyStats.map(stat => ({
          date: stat.date,
          total: parseInt(stat.total),
          sent: parseInt(stat.sent),
          failed: parseInt(stat.failed),
          successRate:
            stat.total > 0
              ? (
                  (parseFloat(stat.sent) / parseFloat(stat.total)) *
                  100
                ).toFixed(2)
              : 0
        })),
        topTemplates,
        dateRange: {
          startDate: startDate || dailyStatsStartDate,
          endDate: endDate || dailyStatsEndDate
        }
      };

      logger.info('EmailHistoryService: Generated email statistics', {
        dateRange,
        filters,
        totalRecords: basicStats.total || 0
      });

      return statistics;
    } catch (error) {
      logger.error('EmailHistoryService.getEmailStatistics error:', error);
      throw error;
    }
  }

  /**
   * Get failed emails that can be retried
   * @param {number} [limit=50] - Maximum number of emails to return
   * @returns {Promise<Array>} Retryable failed emails
   */
  async getRetryableEmails(limit = 50) {
    try {
      const emails = await EmailHistoryRepository.getRetryableEmails(limit);

      logger.info('EmailHistoryService: Retrieved retryable emails', {
        count: emails.length,
        limit
      });

      return emails;
    } catch (error) {
      logger.error('EmailHistoryService.getRetryableEmails error:', error);
      throw error;
    }
  }

  /**
   * Search emails by content or metadata
   * @param {string} searchTerm - Search term
   * @param {Object} options - Search options
   * @returns {Promise<Object>} Search results
   */
  async searchEmails(searchTerm, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        searchIn = ['subject', 'recipient', 'templateName'],
        status,
        category,
        dateFrom,
        dateTo
      } = options;

      const whereClause = {
        [EmailHistoryRepository.model.sequelize.Sequelize.Op.or]: []
      };

      // Build search conditions
      if (searchIn.includes('subject')) {
        whereClause[
          EmailHistoryRepository.model.sequelize.Sequelize.Op.or
        ].push({
          subject: {
            [EmailHistoryRepository.model.sequelize.Sequelize.Op.iLike]:
              `%${searchTerm}%`
          }
        });
      }

      if (searchIn.includes('recipient')) {
        whereClause[
          EmailHistoryRepository.model.sequelize.Sequelize.Op.or
        ].push({
          recipient: {
            [EmailHistoryRepository.model.sequelize.Sequelize.Op.iLike]:
              `%${searchTerm}%`
          }
        });
      }

      if (searchIn.includes('recipientName')) {
        whereClause[
          EmailHistoryRepository.model.sequelize.Sequelize.Op.or
        ].push({
          recipientName: {
            [EmailHistoryRepository.model.sequelize.Sequelize.Op.iLike]:
              `%${searchTerm}%`
          }
        });
      }

      if (searchIn.includes('templateName')) {
        whereClause[
          EmailHistoryRepository.model.sequelize.Sequelize.Op.or
        ].push({
          templateName: {
            [EmailHistoryRepository.model.sequelize.Sequelize.Op.iLike]:
              `%${searchTerm}%`
          }
        });
      }

      // Add additional filters
      if (status) {
        whereClause.status = status;
      }

      if (category) {
        whereClause.category = category;
      }

      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) {
          whereClause.createdAt[
            EmailHistoryRepository.model.sequelize.Sequelize.Op.gte
          ] = new Date(dateFrom);
        }
        if (dateTo) {
          whereClause.createdAt[
            EmailHistoryRepository.model.sequelize.Sequelize.Op.lte
          ] = new Date(dateTo);
        }
      }

      const results = await EmailHistoryRepository.findAllWithPagination({
        where: whereClause,
        page,
        limit,
        orderBy: 'createdAt',
        orderDir: 'DESC'
      });

      logger.info('EmailHistoryService: Performed email search', {
        searchTerm,
        searchIn,
        totalResults: results.totalRecords
      });

      return {
        ...results,
        searchTerm,
        searchOptions: options
      };
    } catch (error) {
      logger.error('EmailHistoryService.searchEmails error:', error);
      throw error;
    }
  }

  /**
   * Clean up old email records
   * @param {number} [daysToKeep=90] - Number of days to keep records
   * @returns {Promise<Object>} Cleanup result
   */
  async cleanupOldRecords(daysToKeep = 90) {
    try {
      const deletedCount =
        await EmailHistoryRepository.cleanupOldRecords(daysToKeep);

      logger.info('EmailHistoryService: Cleaned up old email records', {
        deletedCount,
        daysToKeep
      });

      return {
        deletedCount,
        daysToKeep,
        cleanupDate: new Date()
      };
    } catch (error) {
      logger.error('EmailHistoryService.cleanupOldRecords error:', error);
      throw error;
    }
  }

  /**
   * Generate email delivery report
   * @param {Object} options - Report options
   * @returns {Promise<Object>} Delivery report
   */
  async generateDeliveryReport(options = {}) {
    try {
      const {
        dateFrom,
        dateTo,
        templateName,
        category,
        format = 'summary' // 'summary' or 'detailed'
      } = options;

      const endDate = dateTo ? new Date(dateTo) : new Date();
      const startDate = dateFrom
        ? new Date(dateFrom)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const statistics = await this.getEmailStatistics(
        { startDate, endDate },
        { templateName, category }
      );

      const report = {
        reportDate: new Date(),
        period: {
          startDate,
          endDate,
          days: Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000))
        },
        summary: {
          totalEmails: statistics.overview.total || 0,
          successfulEmails:
            (statistics.overview.sent || 0) +
            (statistics.overview.delivered || 0),
          failedEmails: statistics.overview.failed || 0,
          pendingEmails: statistics.overview.pending || 0,
          successRate: statistics.overview.successRate || 0,
          averagePerDay: Math.round(
            (statistics.overview.total || 0) /
              Math.max(
                1,
                Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000))
              )
          )
        },
        breakdown: statistics.breakdown,
        topTemplates: statistics.topTemplates.slice(0, 5),
        filters: { templateName, category }
      };

      if (format === 'detailed') {
        report.dailyBreakdown = statistics.daily;
        report.trends = this.calculateTrends(statistics.daily);
      }

      logger.info('EmailHistoryService: Generated delivery report', {
        period: report.period,
        totalEmails: report.summary.totalEmails,
        successRate: report.summary.successRate
      });

      return report;
    } catch (error) {
      logger.error('EmailHistoryService.generateDeliveryReport error:', error);
      throw error;
    }
  }

  /**
   * Calculate trends from daily statistics
   * @param {Array} dailyStats - Daily statistics array
   * @returns {Object} Trend analysis
   */
  calculateTrends(dailyStats) {
    if (dailyStats.length < 2) {
      return { trend: 'insufficient_data', change: 0 };
    }

    const recent = dailyStats.slice(-7); // Last 7 days
    const previous = dailyStats.slice(-14, -7); // Previous 7 days

    if (recent.length === 0 || previous.length === 0) {
      return { trend: 'insufficient_data', change: 0 };
    }

    const recentAvg =
      recent.reduce((sum, day) => sum + day.total, 0) / recent.length;
    const previousAvg =
      previous.reduce((sum, day) => sum + day.total, 0) / previous.length;

    const change =
      previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0;

    return {
      trend: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
      change: Math.round(change * 100) / 100,
      recentAverage: Math.round(recentAvg * 100) / 100,
      previousAverage: Math.round(previousAvg * 100) / 100
    };
  }
}

module.exports = new EmailHistoryService();
