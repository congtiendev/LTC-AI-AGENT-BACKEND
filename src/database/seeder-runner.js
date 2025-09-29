// =====================================================
// DATABASE SEEDER RUNNER - Laravel Style
// =====================================================

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('module-alias/register');
const logger = require('@/utils/logger');

class SeederRunner {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASS
    });

    this.seederPath = path.join(__dirname, 'seeders');
    this.seedersTable = 'seeders';
  }

  async init() {
    // Create seeders tracking table
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${this.seedersTable} (
        id SERIAL PRIMARY KEY,
        seeder VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('Seeder system initialized');
  }

  async createSeeder(name) {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, '')
      .slice(0, 14);
    const fileName = `${timestamp}_${name}.js`;
    const filePath = path.join(this.seederPath, fileName);

    const template = `// Seeder: ${name}
// Created at: ${new Date().toISOString()}

class ${this.toCamelCase(name)}Seeder {
  async run(queryInterface) {
    console.log('Running ${name} seeder...');

    // Write your seeder logic here:
    // await queryInterface.query(\`
    //   INSERT INTO table_name (column1, column2) VALUES 
    //   ('value1', 'value2'),
    //   ('value3', 'value4');
    // \`);

    console.log('✅ ${name} seeder completed');
  }
}

module.exports = ${this.toCamelCase(name)}Seeder;`;

    if (!fs.existsSync(this.seederPath)) {
      fs.mkdirSync(this.seederPath, { recursive: true });
    }

    fs.writeFileSync(filePath, template);
    logger.info(`Seeder created: ${fileName}`);
    console.log(`✅ Seeder created: ${fileName}`);
    return fileName;
  }

  async runSeeders(specificSeeder = null) {
    await this.init();

    let seedersToRun;

    if (specificSeeder) {
      // Run specific seeder
      seedersToRun = [specificSeeder];
      console.log(`🌱 Running specific seeder: ${specificSeeder}`);
    } else {
      // Run all pending seeders
      seedersToRun = await this.getPendingSeeders();

      if (seedersToRun.length === 0) {
        console.log('✅ No pending seeders to run');
        return;
      }

      console.log(`🌱 Running ${seedersToRun.length} seeder(s)...`);
    }

    const queryInterface = new QueryInterface(this.pool);

    for (const seeder of seedersToRun) {
      try {
        console.log(`⏳ Running: ${seeder}`);

        const SeederClass = require(path.join(this.seederPath, seeder));
        const seederInstance = new SeederClass();

        await seederInstance.run(queryInterface);

        if (!specificSeeder) {
          await this.recordSeeder(seeder);
        }

        console.log(`✅ Seeded: ${seeder}`);
        logger.info(`Seeder completed: ${seeder}`);
      } catch (error) {
        console.error(`❌ Failed: ${seeder}`);
        logger.error(`Seeder failed: ${seeder}`, error);
        throw error;
      }
    }

    console.log(`🎉 Successfully ran ${seedersToRun.length} seeder(s)`);
  }

  async resetSeeders() {
    console.log('🔄 Resetting all seeders (truncating data)...');

    // Truncate main tables (except users to avoid losing admin)
    const tablesToReset = [
      'role_permissions',
      'user_roles',
      'refresh_tokens',
      'permissions',
      'roles'
    ];

    for (const table of tablesToReset) {
      try {
        await this.pool.query(
          `TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`
        );
        console.log(`🗑️  Reset table: ${table}`);
      } catch (error) {
        console.log(`⚠️  Could not reset table: ${table} (${error.message})`);
      }
    }

    // Clear seeder tracking
    await this.pool.query(
      `TRUNCATE TABLE ${this.seedersTable} RESTART IDENTITY`
    );
    console.log(`🗑️  Reset seeders tracking table`);

    // Re-run all seeders
    await this.runSeeders();
  }

  async status() {
    await this.init();

    const allSeeders = this.getAllSeederFiles();
    const executedSeeders = await this.getExecutedSeederNames();

    console.log('\n🌱 Seeder Status:');
    console.log('===============');

    if (allSeeders.length === 0) {
      console.log('No seeders found');
      return;
    }

    allSeeders.forEach(seeder => {
      const status = executedSeeders.includes(seeder)
        ? '✅ Executed'
        : '⏳ Pending';
      console.log(`${status} - ${seeder}`);
    });

    console.log(
      `\nTotal: ${allSeeders.length} | Executed: ${executedSeeders.length} | Pending: ${allSeeders.length - executedSeeders.length}`
    );
  }

  // Helper methods
  async getPendingSeeders() {
    const allSeeders = this.getAllSeederFiles();
    const executedSeeders = await this.getExecutedSeederNames();
    return allSeeders.filter(s => !executedSeeders.includes(s));
  }

  getAllSeederFiles() {
    if (!fs.existsSync(this.seederPath)) {
      return [];
    }

    return fs
      .readdirSync(this.seederPath)
      .filter(file => file.endsWith('.js'))
      .sort();
  }

  async getExecutedSeederNames() {
    try {
      const result = await this.pool.query(
        `SELECT seeder FROM ${this.seedersTable} ORDER BY id ASC`
      );
      return result.rows.map(row => row.seeder);
    } catch (error) {
      return [];
    }
  }

  async recordSeeder(seeder) {
    await this.pool.query(
      `INSERT INTO ${this.seedersTable} (seeder) VALUES ($1)`,
      [seeder]
    );
  }

  toCamelCase(str) {
    return str
      .replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())
      .replace(/([a-z])/, (match, letter) => letter.toUpperCase());
  }

  async close() {
    await this.pool.end();
  }
}

// Query Interface for seeders (same as migrations)
class QueryInterface {
  constructor(pool) {
    this.pool = pool;
  }

  async query(sql, params = []) {
    return await this.pool.query(sql, params);
  }

  // Bulk insert helper
  async bulkInsert(tableName, data) {
    if (data.length === 0) return;

    const columns = Object.keys(data[0]);
    const values = data.map(row => columns.map(col => row[col]));

    const placeholders = values
      .map(
        (_, i) =>
          `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')}`
      )
      .join(', ');

    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES ${placeholders}`;
    const flatValues = values.flat();

    return await this.query(sql, flatValues);
  }
}

module.exports = { SeederRunner, QueryInterface };
