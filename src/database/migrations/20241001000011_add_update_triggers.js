// Migration: Add Update Triggers

class AddUpdateTriggersMigration {
  async up(queryInterface) {
    console.log('Creating update triggers...');

    // Create function to update updated_at timestamp
    await queryInterface.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers for auto-updating updated_at
    await queryInterface.query(`
      CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryInterface.query(`
      CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Update triggers created successfully');
  }

  async down(queryInterface) {
    console.log('Dropping update triggers...');
    await queryInterface.query(
      'DROP TRIGGER IF EXISTS update_users_updated_at ON users'
    );
    await queryInterface.query(
      'DROP TRIGGER IF EXISTS update_roles_updated_at ON roles'
    );
    await queryInterface.query(
      'DROP FUNCTION IF EXISTS update_updated_at_column'
    );
    console.log('✅ Update triggers dropped');
  }
}

module.exports = AddUpdateTriggersMigration;
