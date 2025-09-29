// Migration: Create Users Table

class CreateUsersTableMigration {
  async up(queryInterface) {
    console.log('Creating users table and user_status enum...');

    await queryInterface.query(`
      CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
    `);

    await queryInterface.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        avatar_url VARCHAR(500),
        phone VARCHAR(20),
        status user_status DEFAULT 'active',
        email_verified BOOLEAN DEFAULT FALSE,
        email_verified_at TIMESTAMP,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await queryInterface.query('CREATE INDEX idx_users_email ON users(email)');
    await queryInterface.query(
      'CREATE INDEX idx_users_username ON users(username)'
    );
    await queryInterface.query(
      'CREATE INDEX idx_users_status ON users(status)'
    );

    console.log('✅ Users table created successfully');
  }

  async down(queryInterface) {
    console.log('Dropping users table...');
    await queryInterface.query('DROP TABLE IF EXISTS users CASCADE');
    await queryInterface.query('DROP TYPE IF EXISTS user_status');
    console.log('✅ Users table dropped');
  }
}

module.exports = CreateUsersTableMigration;
