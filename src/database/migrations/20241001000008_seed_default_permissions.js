// Migration: Seed Default Permissions

class SeedDefaultPermissionsMigration {
  async up(queryInterface) {
    console.log('Seeding default permissions...');

    await queryInterface.query(`
      INSERT INTO permissions (name, display_name, description, module, action) VALUES 
      -- User management permissions
      ('users.create', 'Create Users', 'Can create new users', 'users', 'create'),
      ('users.read', 'View Users', 'Can view user profiles', 'users', 'read'),
      ('users.update', 'Update Users', 'Can edit user information', 'users', 'update'),
      ('users.delete', 'Delete Users', 'Can delete users', 'users', 'delete'),
      ('users.manage_roles', 'Manage User Roles', 'Can assign/remove user roles', 'users', 'manage_roles'),

      -- Role management permissions
      ('roles.create', 'Create Roles', 'Can create new roles', 'roles', 'create'),
      ('roles.read', 'View Roles', 'Can view roles', 'roles', 'read'),
      ('roles.update', 'Update Roles', 'Can edit roles', 'roles', 'update'),
      ('roles.delete', 'Delete Roles', 'Can delete roles', 'roles', 'delete'),
      ('roles.manage_permissions', 'Manage Role Permissions', 'Can assign permissions to roles', 'roles', 'manage_permissions'),

      -- Dashboard & Analytics permissions
      ('dashboard.view', 'View Dashboard', 'Can access main dashboard', 'dashboard', 'read'),
      ('analytics.view', 'View Analytics', 'Can view system analytics', 'analytics', 'read'),

      -- System settings permissions
      ('system.settings', 'System Settings', 'Can modify system settings', 'system', 'update'),
      ('system.logs', 'View System Logs', 'Can view system logs', 'system', 'read'),

      -- Profile management
      ('profile.update', 'Update Profile', 'Can update own profile', 'profile', 'update'),
      ('profile.view', 'View Profile', 'Can view own profile', 'profile', 'read');
    `);

    console.log('✅ Default permissions seeded successfully');
  }

  async down(queryInterface) {
    console.log('Removing default permissions...');
    await queryInterface.query(`
      DELETE FROM permissions WHERE name IN (
        'users.create', 'users.read', 'users.update', 'users.delete', 'users.manage_roles',
        'roles.create', 'roles.read', 'roles.update', 'roles.delete', 'roles.manage_permissions',
        'dashboard.view', 'analytics.view', 'system.settings', 'system.logs', 
        'profile.update', 'profile.view'
      );
    `);
    console.log('✅ Default permissions removed');
  }
}

module.exports = SeedDefaultPermissionsMigration;
