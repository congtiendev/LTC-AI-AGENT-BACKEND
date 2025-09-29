// Migration: Create User Roles Junction Table

class CreateUserRolesTableMigration {
  async up(queryInterface) {
    console.log('Creating user_roles junction table...');

    await queryInterface.query(`
      CREATE TABLE user_roles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL,
        assigned_by INTEGER,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Create indexes
    await queryInterface.query(
      'CREATE UNIQUE INDEX unique_user_role ON user_roles(user_id, role_id)'
    );
    await queryInterface.query(
      'CREATE INDEX idx_user_roles_user ON user_roles(user_id)'
    );
    await queryInterface.query(
      'CREATE INDEX idx_user_roles_role ON user_roles(role_id)'
    );

    console.log('✅ User roles table created successfully');
  }

  async down(queryInterface) {
    console.log('Dropping user_roles table...');
    await queryInterface.query('DROP TABLE IF EXISTS user_roles CASCADE');
    console.log('✅ User roles table dropped');
  }
}

module.exports = CreateUserRolesTableMigration;
