// Seeder: Sample Users
// Created at: Mon 09/29/2025 14:23:07.34

class SampleUsersSeeder {
  async run(queryInterface) {
    console.log('Seeding sample users...');

    const sampleUsers = [
      {
        username: 'john_doe',
        email: 'john.doe@example.com',
        password_hash:
          '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        first_name: 'John',
        last_name: 'Doe',
        status: 'active',
        email_verified: true
      },
      {
        username: 'jane_smith',
        email: 'jane.smith@example.com',
        password_hash:
          '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        first_name: 'Jane',
        last_name: 'Smith',
        status: 'active',
        email_verified: true
      },
      {
        username: 'mike_wilson',
        email: 'mike.wilson@example.com',
        password_hash:
          '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        first_name: 'Mike',
        last_name: 'Wilson',
        status: 'active',
        email_verified: false
      }
    ];

    // Insert sample users
    await queryInterface.bulkInsert('users', sampleUsers);

    // Assign user role to all sample users
    await queryInterface.query(`
      INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
      SELECT u.id, r.id, (SELECT id FROM users WHERE username = 'admin'), TRUE
      FROM users u CROSS JOIN roles r
      WHERE u.username IN ('john_doe', 'jane_smith', 'mike_wilson') AND r.name = 'user';
    `);

    console.log('✅ Sample users seeded successfully');
  }
}

module.exports = SampleUsersSeeder;
