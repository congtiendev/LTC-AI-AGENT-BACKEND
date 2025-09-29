// Migration: Seed Role Permissions

class SeedRolePermissionsMigration {
  async up(queryInterface) {
    console.log('Seeding role-permission assignments...');

    // Super Admin: All permissions
    await queryInterface.query(`
      INSERT INTO role_permissions (role_id, permission_id) 
      SELECT r.id, p.id FROM roles r CROSS JOIN permissions p 
      WHERE r.name = 'super_admin';
    `);

    // Admin: Most permissions except system settings
    await queryInterface.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r CROSS JOIN permissions p 
      WHERE r.name = 'admin' AND p.name NOT IN ('system.settings');
    `);

    // Manager: User and role read, dashboard access
    await queryInterface.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r CROSS JOIN permissions p 
      WHERE r.name = 'manager' AND p.name IN (
        'users.read', 'users.update', 'roles.read', 'dashboard.view', 
        'analytics.view', 'profile.view', 'profile.update'
      );
    `);

    // User: Basic access
    await queryInterface.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r CROSS JOIN permissions p 
      WHERE r.name = 'user' AND p.name IN (
        'dashboard.view', 'profile.view', 'profile.update'
      );
    `);

    // Guest: Very limited access
    await queryInterface.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r CROSS JOIN permissions p 
      WHERE r.name = 'guest' AND p.name IN ('dashboard.view');
    `);

    console.log('✅ Role-permission assignments seeded successfully');
  }

  async down(queryInterface) {
    console.log('Removing role-permission assignments...');
    await queryInterface.query('DELETE FROM role_permissions');
    console.log('✅ Role-permission assignments removed');
  }
}

module.exports = SeedRolePermissionsMigration;
