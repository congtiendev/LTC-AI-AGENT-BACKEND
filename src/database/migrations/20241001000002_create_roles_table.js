// Migration: Create Roles Table

class CreateRolesTableMigration {
  async up(queryInterface) {
    console.log('Creating roles table...');

    await queryInterface.query(`
      CREATE TABLE roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        level INTEGER NOT NULL DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryInterface.query('CREATE INDEX idx_roles_name ON roles(name)');
    await queryInterface.query('CREATE INDEX idx_roles_level ON roles(level)');

    console.log('✅ Roles table created successfully');
  }

  async down(queryInterface) {
    console.log('Dropping roles table...');
    await queryInterface.query('DROP TABLE IF EXISTS roles CASCADE');
    console.log('✅ Roles table dropped');
  }
}

module.exports = CreateRolesTableMigration;
