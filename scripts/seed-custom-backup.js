// =====================================================
// SEEDER CLI SCRIPT
// =====================================================

const { SeederRunner } = require('../src/database/seeder-runner');
require('dotenv').config();

async function main() {
  const runner = new SeederRunner();
  const command = process.argv[2];
  const arg = process.argv[3];

  try {
    switch (command) {
      case 'create':
        if (!arg) {
          console.error(
            '❌ Please provide seeder name: npm run seed:create sample_users'
          );
          process.exit(1);
        }
        await runner.createSeeder(arg);
        break;

      case 'run':
        const specificSeeder = arg ? `${arg}.js` : null;
        await runner.runSeeders(specificSeeder);
        break;

      case 'reset':
      case 'refresh':
        await runner.resetSeeders();
        break;

      case 'status':
        await runner.status();
        break;

      default:
        console.log(`
🌱 KleverBot Database Seeder System

Usage: npm run seed <command> [options]

Commands:
  create <name>      Create a new seeder file
  run [seeder]       Run all pending seeders or specific seeder
  reset|refresh      Reset all data and re-run seeders
  status             Show seeder status

Examples:
  npm run seed:create sample_users
  npm run seed:run
  npm run seed:run 20241001123456_sample_users
  npm run seed:reset
  npm run seed:status
        `);
    }
  } catch (error) {
    console.error('❌ Seeder error:', error.message);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

if (require.main === module) {
  main();
}
