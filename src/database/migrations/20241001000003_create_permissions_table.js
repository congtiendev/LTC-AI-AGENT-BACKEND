// Migration: Create Permissions Table

class CreatePermissionsTableMigration {
  async up(queryInterface) {
    console.log('Creating permissions table...');

    await queryInterface.query(`
      CREATE TABLE permissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        module VARCHAR(50) NOT NULL,
        action VARCHAR(20) NOT NULL,
        resource VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryInterface.query(
      'CREATE INDEX idx_permissions_module ON permissions(module)'
    );
    await queryInterface.query(
      'CREATE INDEX idx_permissions_action ON permissions(action)'
    );
    await queryInterface.query(
      "CREATE UNIQUE INDEX unique_permission ON permissions(module, action, COALESCE(resource, ''))"
    );

    console.log('✅ Permissions table created successfully');
  }

  async down(queryInterface) {
    console.log('Dropping permissions table...');
    await queryInterface.query('DROP TABLE IF EXISTS permissions CASCADE');
    console.log('✅ Permissions table dropped');
  }
}

module.exports = CreatePermissionsTableMigration;
