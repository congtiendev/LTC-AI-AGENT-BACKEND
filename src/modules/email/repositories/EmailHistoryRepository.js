/**
 * EmailHistoryRepository
 * Handles database operations for email history records
 */

const BaseRepository = require('@/repositories/BaseRepository');
const { EmailHistory } = require('@/database/sequelize-models');
const logger = require('@/utils/logger');

/**
 * Repository class for EmailHistory operations
 * @extends BaseRepository
 */
class EmailHistoryRepository extends BaseRepository {
  constructor() {
    super(EmailHistory);
  }

  /**
   * Create a new email history record
   * @param {Object} emailData - Email data object
   * @returns {Promise<Object>} Created email history record
   */
  async createEmailRecord(emailData) {
    try {
      const record = await this.create({
        ...emailData,
        scheduledAt: emailData.scheduledAt || new Date()
      });

      logger.info('EmailHistoryRepository: Created email record', {
        id: record.id,
        recipient: record.recipient,
        template: record.templateName
      });

      return record;
    } catch (error) {
      logger.error('EmailHistoryRepository.createEmailRecord error:', error);
      throw error;
    }
  }

  /**
   * Update email status to sent
   * @param {number} id - Email history ID
   * @param {string} messageId - SMTP message ID
   * @param {Date} [sentAt] - Sent timestamp
   * @returns {Promise<Object>} Updated record
   */
  async markAsSent(id, messageId, sentAt = new Date()) {
    try {
      const [updatedRows] = await this.update(id, {
        status: 'sent',
        messageId,
        sentAt
      });

      if (updatedRows === 0) {
        throw new Error('EMAIL_RECORD_NOT_FOUND');
      }

      const updatedRecord = await this.findById(id);
      logger.info('EmailHistoryRepository: Marked email as sent', {
        id,
        messageId,
        recipient: updatedRecord.recipient
      });

      return updatedRecord;
    } catch (error) {
      logger.error('EmailHistoryRepository.markAsSent error:', error);
      throw error;
    }
  }

  /**
   * Update email status to failed
   * @param {number} id - Email history ID
   * @param {string} errorMessage - Error message
   * @param {string} [errorCode] - Error code
   * @returns {Promise<Object>} Updated record
   */
  async markAsFailed(id, errorMessage, errorCode = null) {
    try {
      const record = await this.findById(id);
      if (!record) {
        throw new Error('EMAIL_RECORD_NOT_FOUND');
      }

      const [updatedRows] = await this.update(id, {
        status: 'failed',
        errorMessage,
        errorCode,
        retryCount: record.retryCount + 1
      });

      if (updatedRows === 0) {
        throw new Error('EMAIL_RECORD_NOT_FOUND');
      }

      const updatedRecord = await this.findById(id);
      logger.warn('EmailHistoryRepository: Marked email as failed', {
        id,
        errorMessage,
        errorCode,
        retryCount: updatedRecord.retryCount,
        recipient: updatedRecord.recipient
      });

      return updatedRecord;
    } catch (error) {
      logger.error('EmailHistoryRepository.markAsFailed error:', error);
      throw error;
    }
  }

  /**
   * Get emails by status with pagination
   * @param {string} status - Email status
   * @param {Object} options - Query options (page, limit, etc.)
   * @returns {Promise<Object>} Paginated results
   */
  async findByStatus(status, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        orderBy = 'createdAt',
        orderDir = 'DESC'
      } = options;

      return await this.findAllWithPagination({
        where: { status },
        page,
        limit,
        orderBy,
        orderDir,
        include: options.includeUser
          ? [
              {
                association: 'user',
                attributes: ['id', 'username', 'email', 'firstName', 'lastName']
              }
            ]
          : []
      });
    } catch (error) {
      logger.error('EmailHistoryRepository.findByStatus error:', error);
      throw error;
    }
  }

  /**
   * Get emails by recipient
   * @param {string} recipient - Recipient email address
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated results
   */
  async findByRecipient(recipient, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        orderBy = 'createdAt',
        orderDir = 'DESC'
      } = options;

      return await this.findAllWithPagination({
        where: { recipient },
        page,
        limit,
        orderBy,
        orderDir
      });
    } catch (error) {
      logger.error('EmailHistoryRepository.findByRecipient error:', error);
      throw error;
    }
  }

  /**
   * Get emails by template name
   * @param {string} templateName - Template name
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Paginated results
   */
  async findByTemplate(templateName, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        orderBy = 'createdAt',
        orderDir = 'DESC'
      } = options;

      return await this.findAllWithPagination({
        where: { templateName },
        page,
        limit,
        orderBy,
        orderDir
      });
    } catch (error) {
      logger.error('EmailHistoryRepository.findByTemplate error:', error);
      throw error;
    }
  }

  /**
   * Get email statistics
   * @param {Object} dateRange - Date range filter
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics(dateRange = {}) {
    try {
      const { startDate, endDate } = dateRange;
      const whereClause = {};

      if (startDate && endDate) {
        whereClause.createdAt = {
          [this.model.sequelize.Sequelize.Op.between]: [startDate, endDate]
        };
      }

      const stats = await this.model.findAll({
        where: whereClause,
        attributes: [
          'status',
          [
            this.model.sequelize.fn('count', this.model.sequelize.col('id')),
            'count'
          ]
        ],
        group: ['status'],
        raw: true
      });

      const result = stats.reduce((acc, stat) => {
        acc[stat.status] = parseInt(stat.count);
        return acc;
      }, {});

      // Calculate totals and success rate
      const total = Object.values(result).reduce(
        (sum, count) => sum + count,
        0
      );
      const sent = result.sent || 0;
      const delivered = result.delivered || 0;
      const successRate =
        total > 0 ? (((sent + delivered) / total) * 100).toFixed(2) : 0;

      logger.info('EmailHistoryRepository: Retrieved statistics', {
        total,
        sent,
        delivered,
        successRate,
        dateRange
      });

      return {
        ...result,
        total,
        successRate: parseFloat(successRate)
      };
    } catch (error) {
      logger.error('EmailHistoryRepository.getStatistics error:', error);
      throw error;
    }
  }

  /**
   * Get top used templates
   * @param {number} limit - Number of templates to return
   * @param {Object} dateRange - Date range filter
   * @returns {Promise<Array>} Top templates with usage stats
   */
  async getTopTemplates(limit = 10, dateRange = {}) {
    try {
      const { startDate, endDate } = dateRange;
      const whereClause = {
        templateName: { [this.model.sequelize.Sequelize.Op.ne]: null }
      };

      if (startDate && endDate) {
        whereClause.createdAt = {
          [this.model.sequelize.Sequelize.Op.between]: [startDate, endDate]
        };
      }

      const templates = await this.model.findAll({
        where: whereClause,
        attributes: [
          'templateName',
          [
            this.model.sequelize.fn('count', this.model.sequelize.col('id')),
            'usage_count'
          ],
          [
            this.model.sequelize.fn(
              'count',
              this.model.sequelize.literal(
                "CASE WHEN status = 'sent' THEN 1 END"
              )
            ),
            'success_count'
          ]
        ],
        group: ['templateName'],
        order: [[this.model.sequelize.literal('usage_count'), 'DESC']],
        limit,
        raw: true
      });

      return templates.map(template => ({
        templateName: template.templateName,
        usageCount: parseInt(template.usage_count),
        successCount: parseInt(template.success_count || 0),
        successRate:
          template.usage_count > 0
            ? (
                (parseFloat(template.success_count || 0) /
                  parseFloat(template.usage_count)) *
                100
              ).toFixed(2)
            : 0
      }));
    } catch (error) {
      logger.error('EmailHistoryRepository.getTopTemplates error:', error);
      throw error;
    }
  }

  /**
   * Get failed emails that can be retried
   * @param {number} [limit=50] - Maximum number of emails to return
   * @returns {Promise<Array>} Failed emails ready for retry
   */
  async getRetryableEmails(limit = 50) {
    try {
      const emails = await this.model.findAll({
        where: {
          status: 'failed',
          retryCount: {
            [this.model.sequelize.Sequelize.Op.lt]:
              this.model.sequelize.col('maxRetries')
          }
        },
        order: [['createdAt', 'ASC']],
        limit
      });

      logger.info('EmailHistoryRepository: Retrieved retryable emails', {
        count: emails.length
      });

      return emails;
    } catch (error) {
      logger.error('EmailHistoryRepository.getRetryableEmails error:', error);
      throw error;
    }
  }

  /**
   * Clean up old email records
   * @param {number} daysToKeep - Number of days to keep records
   * @returns {Promise<number>} Number of deleted records
   */
  async cleanupOldRecords(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deletedCount = await this.model.destroy({
        where: {
          createdAt: {
            [this.model.sequelize.Sequelize.Op.lt]: cutoffDate
          }
        }
      });

      logger.info('EmailHistoryRepository: Cleaned up old records', {
        deletedCount,
        cutoffDate,
        daysToKeep
      });

      return deletedCount;
    } catch (error) {
      logger.error('EmailHistoryRepository.cleanupOldRecords error:', error);
      throw error;
    }
  }
}

module.exports = new EmailHistoryRepository();
