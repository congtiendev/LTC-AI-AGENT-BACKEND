// Seeder: Test Data
// Created at: Mon 09/29/2025 14:23:07.78

class TestDataSeeder {
  async run(queryInterface) {
    console.log('Seeding test data...');

    // Add some test refresh tokens
    await queryInterface.query(`
      INSERT INTO refresh_tokens (user_id, token_hash, device_info, ip_address, expires_at) 
      SELECT u.id, 'test_token_hash_' || u.username, 'Test Device', '127.0.0.1'::inet, 
             CURRENT_TIMESTAMP + INTERVAL '7 days'
      FROM users u WHERE u.username IN ('admin', 'manager', 'user1');
    `);

    console.log('✅ Test data seeded successfully');
  }
}

module.exports = TestDataSeeder;
