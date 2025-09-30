// =====================================================
// MIGRATION CLI SCRIPT
// =====================================================

const { MigrationRunner } = require('../src/database/migration-runner');
require('dotenv').config();

async function main() {
  const runner = new MigrationRunner();
  const command = process.argv[2];
  const arg = process.argv[3];

  try {
    switch (command) {
      case 'create':
        if (!arg) {
          console.error(
            '❌ Please provide migration name: npm run migrate:create create_users_table'
          );
          process.exit(1);
        }
        await runner.createMigration(arg);
        break;

      case 'run':
      case 'up':
        await runner.runMigrations();
        break;

      case 'rollback':
      case 'down':
        const steps = arg ? parseInt(arg) : 1;
        await runner.rollback(steps);
        break;

      case 'status':
        await runner.status();
        break;

      case 'fresh':
        await runner.fresh();
        break;

      default:
        console.log(`
🔧 KleverBot Migration System

Usage: npm run migrate <command> [options]

Commands:
  create <name>   Create a new migration file
  run|up           Run pending migrations
  rollback|down    Rollback last migration
  rollback <n>     Rollback n migrations
  status           Show migration status
  fresh            Drop all tables and re-run migrations

Examples:
  npm run migrate:create create_users_table
  npm run migrate:run
  npm run migrate:rollback
  npm run migrate:status
  npm run migrate:fresh
        `);
    }
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

if (require.main === module) {
  main();
}
