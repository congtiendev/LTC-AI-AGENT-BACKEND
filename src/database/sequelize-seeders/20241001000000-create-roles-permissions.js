'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Insert default roles
    await queryInterface.bulkInsert(
      'Roles',
      [
        {
          name: 'admin',
          description: 'Administrator role with full access',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'user',
          description: 'Regular user role with basic access',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'moderator',
          description: 'Moderator role with limited administrative access',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      {}
    );

    // Insert default permissions
    await queryInterface.bulkInsert(
      'Permissions',
      [
        // User permissions
        {
          name: 'users:read',
          displayName: 'Read Users',
          description: 'Read user information',
          module: 'users',
          action: 'read',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'users:create',
          displayName: 'Create Users',
          description: 'Create new users',
          module: 'users',
          action: 'create',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'users:update',
          displayName: 'Update Users',
          description: 'Update user information',
          module: 'users',
          action: 'update',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'users:delete',
          displayName: 'Delete Users',
          description: 'Delete users',
          module: 'users',
          action: 'delete',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        // Role permissions
        {
          name: 'roles:read',
          displayName: 'Read Roles',
          description: 'Read role information',
          module: 'roles',
          action: 'read',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'roles:create',
          displayName: 'Create Roles',
          description: 'Create new roles',
          module: 'roles',
          action: 'create',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'roles:update',
          displayName: 'Update Roles',
          description: 'Update role information',
          module: 'roles',
          action: 'update',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'roles:delete',
          displayName: 'Delete Roles',
          description: 'Delete roles',
          module: 'roles',
          action: 'delete',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      {}
    );

    // Get role and permission IDs for assignments
    const roles = await queryInterface.sequelize.query(
      "SELECT id, name FROM \"Roles\" WHERE name IN ('admin', 'user', 'moderator')",
      { type: Sequelize.QueryTypes.SELECT }
    );

    const permissions = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Permissions"',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (roles.length > 0 && permissions.length > 0) {
      const adminRole = roles.find(r => r.name === 'admin');
      const userRole = roles.find(r => r.name === 'user');
      const moderatorRole = roles.find(r => r.name === 'moderator');

      const rolePermissions = [];

      // Admin gets all permissions
      if (adminRole) {
        permissions.forEach(permission => {
          rolePermissions.push({
            roleId: adminRole.id,
            permissionId: permission.id,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        });
      }

      // User gets read permissions only
      if (userRole) {
        const readPermissions = permissions.filter(p =>
          p.name.includes(':read')
        );
        readPermissions.forEach(permission => {
          rolePermissions.push({
            roleId: userRole.id,
            permissionId: permission.id,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        });
      }

      // Moderator gets read and update permissions
      if (moderatorRole) {
        const modPermissions = permissions.filter(
          p => p.name.includes(':read') || p.name.includes(':update')
        );
        modPermissions.forEach(permission => {
          rolePermissions.push({
            roleId: moderatorRole.id,
            permissionId: permission.id,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        });
      }

      if (rolePermissions.length > 0) {
        await queryInterface.bulkInsert('RolePermissions', rolePermissions, {});
      }
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove role permissions
    await queryInterface.bulkDelete('RolePermissions', null, {});

    // Remove permissions
    await queryInterface.bulkDelete('Permissions', null, {});

    // Remove roles
    await queryInterface.bulkDelete('Roles', null, {});
  }
};
