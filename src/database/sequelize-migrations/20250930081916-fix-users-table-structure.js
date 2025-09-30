'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, backup existing data
    await queryInterface.sequelize.query(`
      CREATE TABLE users_backup AS SELECT * FROM users;
    `);

    // Drop existing users table
    await queryInterface.dropTable('users');

    // Create new Users table with proper structure
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active'
      },
      emailVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      emailVerifiedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      lastLoginAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Migrate data from backup with column mapping
    await queryInterface.sequelize.query(`
      INSERT INTO "Users" (
        username, email, password, "firstName", "lastName", phone, 
        status, "emailVerified", "emailVerifiedAt", "lastLoginAt",
        "createdAt", "updatedAt"
      )
      SELECT 
        username, email, password, first_name, last_name, phone,
        status::"enum_Users_status", email_verified, email_verified_at, last_login_at,
        created_at, updated_at
      FROM users_backup;
    `);

    // Update UserRoles foreign key references
    await queryInterface.sequelize.query(`
      UPDATE "UserRoles" SET "userId" = (
        SELECT u.id FROM "Users" u 
        JOIN users_backup ub ON ub.username = u.username 
        WHERE ub.id = "UserRoles"."userId"
      );
    `);

    // Drop backup table
    await queryInterface.sequelize.query('DROP TABLE users_backup;');

    // Add foreign key constraint
    await queryInterface.addConstraint('UserRoles', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'fk_user_roles_user_id',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove foreign key constraint
    await queryInterface.removeConstraint('UserRoles', 'fk_user_roles_user_id');

    // Backup Users data
    await queryInterface.sequelize.query(`
      CREATE TABLE users_restore AS SELECT * FROM "Users";
    `);

    // Drop Users table
    await queryInterface.dropTable('Users');

    // Recreate original users table structure
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      first_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      last_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active'
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      email_verified_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Restore data with column mapping
    await queryInterface.sequelize.query(`
      INSERT INTO users (
        username, email, password, first_name, last_name, phone,
        status, email_verified, email_verified_at, last_login_at,
        created_at, updated_at
      )
      SELECT 
        username, email, password, "firstName", "lastName", phone,
        status::text, "emailVerified", "emailVerifiedAt", "lastLoginAt",
        "createdAt", "updatedAt"
      FROM users_restore;
    `);

    // Drop restore table
    await queryInterface.sequelize.query('DROP TABLE users_restore;');
  }
};
