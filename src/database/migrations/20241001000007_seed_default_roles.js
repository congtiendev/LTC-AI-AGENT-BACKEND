// Migration: Seed Default Roles

class SeedDefaultRolesMigration {
  async up(queryInterface) {
    console.log('Seeding default roles...');

    await queryInterface.query(`
      INSERT INTO roles (name, display_name, description, level) VALUES 
      ('super_admin', 'Super Administrator', 'Full system access', 100),
      ('admin', 'Administrator', 'Administrative access', 80),
      ('manager', 'Manager', 'Management level access', 60),
      ('user', 'User', 'Standard user access', 40),
      ('guest', 'Guest', 'Limited access', 20);
    `);

    console.log('✅ Default roles seeded successfully');
  }

  async down(queryInterface) {
    console.log('Removing default roles...');
    await queryInterface.query(
      "DELETE FROM roles WHERE name IN ('super_admin', 'admin', 'manager', 'user', 'guest'^)"
    );
    console.log('✅ Default roles removed');
  }
}

module.exports = SeedDefaultRolesMigration;
