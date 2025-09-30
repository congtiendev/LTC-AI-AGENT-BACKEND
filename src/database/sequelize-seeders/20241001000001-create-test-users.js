'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Hash password for test user
    const hashedPassword = await bcrypt.hash('TestPass123!', 12);

    // Insert test user
    await queryInterface.bulkInsert(
      'users',
      [
        {
          username: 'testuser',
          email: 'test@example.com',
          password: hashedPassword,
          first_name: 'Test',
          last_name: 'User',
          phone: '0123456789',
          status: 'active',
          email_verified: true,
          email_verified_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          username: 'admin',
          email: 'admin@kleverbot.ai',
          password: hashedPassword,
          first_name: 'Admin',
          last_name: 'User',
          phone: '0987654321',
          status: 'active',
          email_verified: true,
          email_verified_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }
      ],
      {}
    );

    // Get user IDs for role assignment
    const users = await queryInterface.sequelize.query(
      "SELECT id, username FROM users WHERE username IN ('testuser', 'admin')",
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Get role IDs
    const roles = await queryInterface.sequelize.query(
      "SELECT id, name FROM \"Roles\" WHERE name IN ('user', 'admin')",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (users.length > 0 && roles.length > 0) {
      const userRole = roles.find(r => r.name === 'user');
      const adminRole = roles.find(r => r.name === 'admin');
      const testUser = users.find(u => u.username === 'testuser');
      const adminUser = users.find(u => u.username === 'admin');

      const userRoles = [];

      // Assign user role to testuser
      if (testUser && userRole) {
        userRoles.push({
          userId: testUser.id,
          roleId: userRole.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Assign admin role to admin user
      if (adminUser && adminRole) {
        userRoles.push({
          userId: adminUser.id,
          roleId: adminRole.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      if (userRoles.length > 0) {
        await queryInterface.bulkInsert('UserRoles', userRoles, {});
      }
    }

    console.log('✅ Test users created successfully:');
    console.log('   - testuser / test@example.com (password: TestPass123!)');
    console.log('   - admin / admin@kleverbot.ai (password: TestPass123!)');
  },

  async down(queryInterface, Sequelize) {
    // Remove test users and their roles
    await queryInterface.bulkDelete(
      'UserRoles',
      {
        userId: {
          [Sequelize.Op.in]: queryInterface.sequelize.literal(
            "(SELECT id FROM users WHERE username IN ('testuser', 'admin'))"
          )
        }
      },
      {}
    );

    await queryInterface.bulkDelete(
      'users',
      {
        username: {
          [Sequelize.Op.in]: ['testuser', 'admin']
        }
      },
      {}
    );

    console.log('✅ Test users removed successfully');
  }
};
