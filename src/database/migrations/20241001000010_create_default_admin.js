// Migration: Create Default Admin User

class CreateDefaultAdminMigration {
  async up(queryInterface) {
    console.log('Creating default admin user...');

    // Create admin user
    await queryInterface.query(`
      INSERT INTO users (
        username, email, password_hash, first_name, last_name, 
        status, email_verified, email_verified_at
      ) VALUES (
        'admin', 
        'admin@kleverbot.com', 
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
        'System', 
        'Administrator',
        'active',
        TRUE,
        CURRENT_TIMESTAMP
      );
    `);

    // Assign super_admin role to admin
    await queryInterface.query(`
      INSERT INTO user_roles (user_id, role_id, assigned_by, is_active) 
      SELECT u.id, r.id, u.id, TRUE
      FROM users u CROSS JOIN roles r 
      WHERE u.username = 'admin' AND r.name = 'super_admin';
    `);

    // Create sample manager user
    await queryInterface.query(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, status, email_verified) 
      VALUES ('manager', 'manager@kleverbot.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Manager', 'active', TRUE);
    `);

    // Assign manager role
    await queryInterface.query(`
      INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
      SELECT u.id, r.id, (SELECT id FROM users WHERE username = 'admin'), TRUE
      FROM users u CROSS JOIN roles r
      WHERE u.username = 'manager' AND r.name = 'manager';
    `);

    // Create sample regular user
    await queryInterface.query(`
      INSERT INTO users (username, email, password_hash, first_name, last_name, status, email_verified)
      VALUES ('user1', 'user1@kleverbot.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jane', 'User', 'active', TRUE);
    `);

    // Assign user role
    await queryInterface.query(`
      INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
      SELECT u.id, r.id, (SELECT id FROM users WHERE username = 'admin'), TRUE
      FROM users u CROSS JOIN roles r
      WHERE u.username = 'user1' AND r.name = 'user';
    `);

    console.log('✅ Default users created successfully');
    console.log('   - admin@kleverbot.com (password: admin123) - super_admin');
    console.log('   - manager@kleverbot.com (password: admin123) - manager');
    console.log('   - user1@kleverbot.com (password: admin123) - user');
  }

  async down(queryInterface) {
    console.log('Removing default users...');
    await queryInterface.query(
      "DELETE FROM users WHERE username IN ('admin', 'manager', 'user1'^)"
    );
    console.log('✅ Default users removed');
  }
}

module.exports = CreateDefaultAdminMigration;
