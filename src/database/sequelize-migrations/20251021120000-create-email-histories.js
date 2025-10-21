'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('email_histories', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      recipient: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Email address of the recipient'
      },
      recipientName: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Display name of the recipient'
      },
      subject: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: 'Email subject line'
      },
      templateName: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Template used for the email'
      },
      templateData: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Data passed to the template'
      },
      htmlContent: {
        type: Sequelize.TEXT('long'),
        allowNull: true,
        comment: 'Final HTML content sent'
      },
      textContent: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Plain text version of the email'
      },
      status: {
        type: Sequelize.ENUM(
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
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'SMTP message ID for tracking'
      },
      provider: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Email provider used (gmail, smtp, etc.)'
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Email category (welcome, password-reset, notification, etc.)'
      },
      priority: {
        type: Sequelize.ENUM('low', 'normal', 'high', 'urgent'),
        defaultValue: 'normal',
        allowNull: false,
        comment: 'Email priority level'
      },
      scheduledAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the email was scheduled to be sent'
      },
      sentAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the email was actually sent'
      },
      deliveredAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the email was delivered (if tracked)'
      },
      openedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When the email was first opened (if tracked)'
      },
      clickedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'When links in the email were clicked (if tracked)'
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Error message if sending failed'
      },
      errorCode: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Error code for categorizing failures'
      },
      retryCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
        comment: 'Number of retry attempts'
      },
      maxRetries: {
        type: Sequelize.INTEGER,
        defaultValue: 3,
        allowNull: false,
        comment: 'Maximum number of retry attempts'
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'User who triggered the email (if applicable)'
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Additional metadata for the email'
      },
      tags: {
        type: Sequelize.JSON,
        allowNull: true,
        comment: 'Tags for categorizing and filtering emails'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better query performance
    await queryInterface.addIndex('email_histories', ['recipient'], {
      name: 'idx_email_histories_recipient'
    });

    await queryInterface.addIndex('email_histories', ['status'], {
      name: 'idx_email_histories_status'
    });

    await queryInterface.addIndex('email_histories', ['templateName'], {
      name: 'idx_email_histories_template_name'
    });

    await queryInterface.addIndex('email_histories', ['category'], {
      name: 'idx_email_histories_category'
    });

    await queryInterface.addIndex('email_histories', ['sentAt'], {
      name: 'idx_email_histories_sent_at'
    });

    await queryInterface.addIndex('email_histories', ['userId'], {
      name: 'idx_email_histories_user_id'
    });

    await queryInterface.addIndex('email_histories', ['messageId'], {
      name: 'idx_email_histories_message_id'
    });

    await queryInterface.addIndex('email_histories', ['createdAt'], {
      name: 'idx_email_histories_created_at'
    });
  },

  async down(queryInterface, _Sequelize) {
    // Remove indexes first
    await queryInterface.removeIndex(
      'email_histories',
      'idx_email_histories_recipient'
    );
    await queryInterface.removeIndex(
      'email_histories',
      'idx_email_histories_status'
    );
    await queryInterface.removeIndex(
      'email_histories',
      'idx_email_histories_template_name'
    );
    await queryInterface.removeIndex(
      'email_histories',
      'idx_email_histories_category'
    );
    await queryInterface.removeIndex(
      'email_histories',
      'idx_email_histories_sent_at'
    );
    await queryInterface.removeIndex(
      'email_histories',
      'idx_email_histories_user_id'
    );
    await queryInterface.removeIndex(
      'email_histories',
      'idx_email_histories_message_id'
    );
    await queryInterface.removeIndex(
      'email_histories',
      'idx_email_histories_created_at'
    );

    // Drop the table
    await queryInterface.dropTable('email_histories');
  }
};
