// Migration: Create Refresh Tokens Table

class CreateRefreshTokensTableMigration {
  async up(queryInterface) {
    console.log('Creating refresh_tokens table...');

    await queryInterface.query(`
      CREATE TABLE refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        device_info TEXT,
        ip_address INET,
        user_agent TEXT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Create indexes
    await queryInterface.query(
      'CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id)'
    );
    await queryInterface.query(
      'CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at)'
    );

    console.log('✅ Refresh tokens table created successfully');
  }

  async down(queryInterface) {
    console.log('Dropping refresh_tokens table...');
    await queryInterface.query('DROP TABLE IF EXISTS refresh_tokens CASCADE');
    console.log('✅ Refresh tokens table dropped');
  }
}

module.exports = CreateRefreshTokensTableMigration;
