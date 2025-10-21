/**
 * EmailHistory Model
 * Tracks all email sending activities with comprehensive logging
 */

/**
 * Email History model definition
 * @param {import('sequelize').Sequelize} sequelize
 * @param {import('sequelize').DataTypes} DataTypes
 * @returns {import('sequelize').Model}
 */
module.exports = (sequelize, DataTypes) => {
  const EmailHistory = sequelize.define(
    'EmailHistory',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      recipient: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Email address of the recipient'
      },
      recipientName: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Display name of the recipient'
      },
      subject: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: 'Email subject line'
      },
      templateName: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Template used for the email'
      },
      templateData: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Data passed to the template'
      },
      htmlContent: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        comment: 'Final HTML content sent'
      },
      textContent: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Plain text version of the email'
      },
      status: {
        type: DataTypes.ENUM(
          'pending',
          'sent',
          'failed',
          'bounced',
          'delivered'
        ),
        defaultValue: 'pending',
        allowNull: false,
        comment: 'Current status of the email'
      },
      messageId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'SMTP message ID for tracking'
      },
      provider: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Email provider used (gmail, smtp, etc.)'
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Email category (welcome, password-reset, notification, etc.)'
      },
      priority: {
        type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
        defaultValue: 'normal',
        allowNull: false,
        comment: 'Email priority level'
      },
      scheduledAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the email was scheduled to be sent'
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the email was actually sent'
      },
      deliveredAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the email was delivered (if tracked)'
      },
      openedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the email was first opened (if tracked)'
      },
      clickedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When links in the email were clicked (if tracked)'
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Error message if sending failed'
      },
      errorCode: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Error code for categorizing failures'
      },
      retryCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Number of retry attempts'
      },
      maxRetries: {
        type: DataTypes.INTEGER,
        defaultValue: 3,
        allowNull: false,
        comment: 'Maximum number of retry attempts'
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'User who triggered the email (if applicable)'
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional metadata for the email'
      },
      tags: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Tags for categorizing and filtering emails'
      }
    },
    {
      tableName: 'email_histories',
      timestamps: true,
      paranoid: false,
      indexes: [
        {
          fields: ['recipient']
        },
        {
          fields: ['status']
        },
        {
          fields: ['templateName']
        },
        {
          fields: ['category']
        },
        {
          fields: ['sentAt']
        },
        {
          fields: ['userId']
        },
        {
          fields: ['messageId']
        }
      ],
      hooks: {
        beforeCreate: emailHistory => {
          if (!emailHistory.scheduledAt) {
            emailHistory.scheduledAt = new Date();
          }
        },
        beforeUpdate: emailHistory => {
          if (emailHistory.status === 'sent' && !emailHistory.sentAt) {
            emailHistory.sentAt = new Date();
          }
          if (
            emailHistory.status === 'delivered' &&
            !emailHistory.deliveredAt
          ) {
            emailHistory.deliveredAt = new Date();
          }
        }
      }
    }
  );

  /**
   * Model associations
   */
  EmailHistory.associate = function (models) {
    // Association with User model if available
    if (models.User) {
      EmailHistory.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'SET NULL'
      });
    }
  };

  /**
   * Instance methods
   */
  EmailHistory.prototype.markAsSent = function (
    messageId,
    sentAt = new Date()
  ) {
    this.status = 'sent';
    this.messageId = messageId;
    this.sentAt = sentAt;
    return this.save();
  };

  EmailHistory.prototype.markAsFailed = function (
    errorMessage,
    errorCode = null
  ) {
    this.status = 'failed';
    this.errorMessage = errorMessage;
    this.errorCode = errorCode;
    return this.save();
  };

  EmailHistory.prototype.incrementRetry = function () {
    this.retryCount += 1;
    return this.save();
  };

  EmailHistory.prototype.canRetry = function () {
    return this.retryCount < this.maxRetries && this.status === 'failed';
  };

  /**
   * Class methods
   */
  EmailHistory.getStatistics = async function (dateRange = {}) {
    const { startDate, endDate } = dateRange;
    const whereClause = {};

    if (startDate && endDate) {
      whereClause.createdAt = {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      };
    }

    const stats = await this.findAll({
      where: whereClause,
      attributes: [
        'status',
        [sequelize.fn('count', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    return stats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
      return acc;
    }, {});
  };

  EmailHistory.getTopTemplates = async function (limit = 10, dateRange = {}) {
    const { startDate, endDate } = dateRange;
    const whereClause = { templateName: { [sequelize.Sequelize.Op.ne]: null } };

    if (startDate && endDate) {
      whereClause.createdAt = {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      };
    }

    return await this.findAll({
      where: whereClause,
      attributes: [
        'templateName',
        [sequelize.fn('count', sequelize.col('id')), 'usage_count'],
        [
          sequelize.fn(
            'count',
            sequelize.literal("CASE WHEN status = 'sent' THEN 1 END")
          ),
          'success_count'
        ]
      ],
      group: ['templateName'],
      order: [[sequelize.literal('usage_count'), 'DESC']],
      limit,
      raw: true
    });
  };

  return EmailHistory;
};
