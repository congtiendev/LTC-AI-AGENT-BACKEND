// Migration: Create Role Permissions Junction Table

class CreateRolePermissionsTableMigration {
  async up(queryInterface) {
    console.log('Creating role_permissions junction table...');

    await queryInterface.query(`
      CREATE TABLE role_permissions (
        id SERIAL PRIMARY KEY,
        role_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL,
        granted_by INTEGER,
        granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Create indexes
    await queryInterface.query(
      'CREATE UNIQUE INDEX unique_role_permission ON role_permissions(role_id, permission_id)'
    );
    await queryInterface.query(
      'CREATE INDEX idx_role_permissions_role ON role_permissions(role_id)'
    );
    await queryInterface.query(
      'CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id)'
    );

    console.log('✅ Role permissions table created successfully');
  }

  async down(queryInterface) {
    console.log('Dropping role_permissions table...');
    await queryInterface.query('DROP TABLE IF EXISTS role_permissions CASCADE');
    console.log('✅ Role permissions table dropped');
  }
}

module.exports = CreateRolePermissionsTableMigration;
