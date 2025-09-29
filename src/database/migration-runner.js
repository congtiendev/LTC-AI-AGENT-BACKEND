// =====================================================
// MIGRATION RUNNER - Laravel Style for Node.js
// =====================================================

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('module-alias/register');
const logger = require('@/utils/logger');

class MigrationRunner {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASS
    });

    this.migrationPath = path.join(__dirname, 'migrations');
    this.migrationsTable = 'migrations';
  }

  async init() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id SERIAL PRIMARY KEY,
        migration VARCHAR(255) NOT NULL,
        batch INTEGER NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('Migration system initialized');
  }

  async runMigrations() {
    await this.init();

    const pendingMigrations = await this.getPendingMigrations();
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations');
      return;
    }

    console.log(`📦 Running ${pendingMigrations.length} migration(s)...`);

    const batch = await this.getNextBatch();
    const queryInterface = new QueryInterface(this.pool);

    for (const migration of pendingMigrations) {
      try {
        console.log(`⏳ Running: ${migration}`);

        const MigrationClass = require(
          path.join(this.migrationPath, migration)
        );
        const migrationInstance = new MigrationClass();

        await migrationInstance.up(queryInterface);
        await this.recordMigration(migration, batch);

        console.log(`✅ Migrated: ${migration}`);
        logger.info(`Migration completed: ${migration}`);
      } catch (error) {
        console.error(`❌ Failed: ${migration}`);
        logger.error(`Migration failed: ${migration}`, error);
        throw error;
      }
    }

    console.log(`🎉 Successfully ran ${pendingMigrations.length} migration(s)`);
  }

  async createMigration(name) {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, '')
      .slice(0, 14);
    const fileName = `${timestamp}_${name}.js`;
    const filePath = path.join(this.migrationPath, fileName);

    let template;

    // Generate different templates based on migration name
    if (name.startsWith('create_') && name.includes('_table')) {
      template = this.getCreateTableTemplate(name);
    } else if (name.startsWith('add_') && name.includes('_to_')) {
      template = this.getAddColumnTemplate(name);
    } else if (name.startsWith('drop_') && name.includes('_from_')) {
      template = this.getDropColumnTemplate(name);
    } else if (name.startsWith('modify_') && name.includes('_in_')) {
      template = this.getModifyColumnTemplate(name);
    } else if (name.startsWith('rename_')) {
      template = this.getRenameTemplate(name);
    } else {
      template = this.getGenericTemplate(name);
    }

    if (!fs.existsSync(this.migrationPath)) {
      fs.mkdirSync(this.migrationPath, { recursive: true });
    }

    fs.writeFileSync(filePath, template);
    logger.info(`Migration created: ${fileName}`);
    console.log(`✅ Migration created: ${fileName}`);
    return fileName;
  }

  // Migration templates
  getCreateTableTemplate(name) {
    const tableName = name.replace('create_', '').replace('_table', '');
    return `// Migration: ${name}
// Created at: ${new Date().toISOString()}

class ${this.toCamelCase(name)}Migration {
  async up(queryInterface) {
    console.log('Creating ${tableName} table...');

    await queryInterface.createTable('${tableName}', (table) => {
      table.id();
      table.string('name');
      table.timestamps();
    });
  }

  async down(queryInterface) {
    console.log('Dropping ${tableName} table...');
    await queryInterface.dropTable('${tableName}');
  }
}

module.exports = ${this.toCamelCase(name)}Migration;`;
  }

  getAddColumnTemplate(name) {
    // Extract info: add_email_to_users
    const parts = name.split('_');
    const toIndex = parts.indexOf('to');
    const columnName = parts.slice(1, toIndex).join('_');
    const tableName = parts.slice(toIndex + 1).join('_');

    return `// Migration: ${name}
// Created at: ${new Date().toISOString()}

class ${this.toCamelCase(name)}Migration {
  async up(queryInterface) {
    console.log('Adding ${columnName} column to ${tableName} table...');

    await queryInterface.addColumn('${tableName}', '${columnName}', 'VARCHAR(255)', {
      nullable: true
      // default: 'some_value'
    });
  }

  async down(queryInterface) {
    console.log('Dropping ${columnName} column from ${tableName} table...');
    await queryInterface.dropColumn('${tableName}', '${columnName}');
  }
}

module.exports = ${this.toCamelCase(name)}Migration;`;
  }

  getDropColumnTemplate(name) {
    // Extract info: drop_email_from_users
    const parts = name.split('_');
    const fromIndex = parts.indexOf('from');
    const columnName = parts.slice(1, fromIndex).join('_');
    const tableName = parts.slice(fromIndex + 1).join('_');

    return `// Migration: ${name}
// Created at: ${new Date().toISOString()}

class ${this.toCamelCase(name)}Migration {
  async up(queryInterface) {
    console.log('Dropping ${columnName} column from ${tableName} table...');
    await queryInterface.dropColumn('${tableName}', '${columnName}');
  }

  async down(queryInterface) {
    console.log('Adding back ${columnName} column to ${tableName} table...');
    // Add back the column (you may need to adjust the type)
    await queryInterface.addColumn('${tableName}', '${columnName}', 'VARCHAR(255)');
  }
}

module.exports = ${this.toCamelCase(name)}Migration;`;
  }

  getModifyColumnTemplate(name) {
    // Extract info: modify_email_in_users
    const parts = name.split('_');
    const inIndex = parts.indexOf('in');
    const columnName = parts.slice(1, inIndex).join('_');
    const tableName = parts.slice(inIndex + 1).join('_');

    return `// Migration: ${name}
// Created at: ${new Date().toISOString()}

class ${this.toCamelCase(name)}Migration {
  async up(queryInterface) {
    console.log('Modifying ${columnName} column in ${tableName} table...');

    await queryInterface.modifyColumn('${tableName}', '${columnName}', 'TEXT', {
      nullable: false,
      default: 'default_value'
    });
  }

  async down(queryInterface) {
    console.log('Reverting ${columnName} column in ${tableName} table...');
    // Revert to original type
    await queryInterface.modifyColumn('${tableName}', '${columnName}', 'VARCHAR(255)', {
      nullable: true
    });
  }
}

module.exports = ${this.toCamelCase(name)}Migration;`;
  }

  getRenameTemplate(name) {
    return `// Migration: ${name}
// Created at: ${new Date().toISOString()}

class ${this.toCamelCase(name)}Migration {
  async up(queryInterface) {
    console.log('Running ${name} migration...');

    // Example rename operations:
    // await queryInterface.renameTable('old_table', 'new_table');
    // await queryInterface.renameColumn('table_name', 'old_column', 'new_column');
  }

  async down(queryInterface) {
    console.log('Reverting ${name} migration...');

    // Reverse the rename operations:
    // await queryInterface.renameTable('new_table', 'old_table');
    // await queryInterface.renameColumn('table_name', 'new_column', 'old_column');
  }
}

module.exports = ${this.toCamelCase(name)}Migration;`;
  }

  getGenericTemplate(name) {
    return `// Migration: ${name}
// Created at: ${new Date().toISOString()}

class ${this.toCamelCase(name)}Migration {
  async up(queryInterface) {
    console.log('Running ${name} migration...');

    // Write your migration here:
    // await queryInterface.query(\`
    //   -- Your SQL here
    // \`);

    // Available methods:
    // queryInterface.createTable(name, callback)
    // queryInterface.dropTable(name)
    // queryInterface.addColumn(table, column, type, options)
    // queryInterface.dropColumn(table, column)
    // queryInterface.modifyColumn(table, column, newType, options)
    // queryInterface.renameColumn(table, oldName, newName)
    // queryInterface.renameTable(oldName, newName)
    // queryInterface.addIndex(table, columns, indexName, options)
    // queryInterface.dropIndex(indexName)
    // queryInterface.addForeignKey(table, column, refTable, refColumn, options)
    // queryInterface.dropForeignKey(table, constraintName)
  }

  async down(queryInterface) {
    console.log('Rolling back ${name} migration...');

    // Write your rollback here:
    // await queryInterface.query(\`
    //   -- Your rollback SQL here
    // \`);
  }
}

module.exports = ${this.toCamelCase(name)}Migration;`;
  }

  async rollback(steps = 1) {
    await this.init();

    const executedMigrations = await this.getExecutedMigrations(steps);
    if (executedMigrations.length === 0) {
      console.log('✅ No migrations to rollback');
      return;
    }

    console.log(`📦 Rolling back ${executedMigrations.length} migration(s)...`);

    const queryInterface = new QueryInterface(this.pool);

    for (const migrationRecord of executedMigrations.reverse()) {
      try {
        console.log(`⏳ Rolling back: ${migrationRecord.migration}`);

        const MigrationClass = require(
          path.join(this.migrationPath, migrationRecord.migration)
        );
        const migrationInstance = new MigrationClass();

        await migrationInstance.down(queryInterface);
        await this.removeMigrationRecord(migrationRecord.migration);

        console.log(`✅ Rolled back: ${migrationRecord.migration}`);
        logger.info(`Migration rolled back: ${migrationRecord.migration}`);
      } catch (error) {
        console.error(`❌ Rollback failed: ${migrationRecord.migration}`);
        logger.error(`Rollback failed: ${migrationRecord.migration}`, error);
        throw error;
      }
    }

    console.log(
      `🎉 Successfully rolled back ${executedMigrations.length} migration(s)`
    );
  }

  async fresh() {
    console.log('🔄 Fresh migration (drop all tables)...');

    const result = await this.pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename != '${this.migrationsTable}'
    `);

    for (const row of result.rows) {
      await this.pool.query(`DROP TABLE IF EXISTS "${row.tablename}" CASCADE`);
      console.log(`🗑️  Dropped table: ${row.tablename}`);
    }

    await this.pool.query(`DROP TABLE IF EXISTS ${this.migrationsTable}`);
    console.log(`🗑️  Dropped table: ${this.migrationsTable}`);

    await this.runMigrations();
  }

  async status() {
    await this.init();

    const allMigrations = this.getAllMigrationFiles();
    const executedMigrations = await this.getExecutedMigrationNames();

    console.log('\n📋 Migration Status:');
    console.log('==================');

    if (allMigrations.length === 0) {
      console.log('No migrations found');
      return;
    }

    allMigrations.forEach(migration => {
      const status = executedMigrations.includes(migration)
        ? '✅ Executed'
        : '⏳ Pending';
      console.log(`${status} - ${migration}`);
    });

    console.log(
      `\nTotal: ${allMigrations.length} | Executed: ${executedMigrations.length} | Pending: ${allMigrations.length - executedMigrations.length}`
    );
  }

  // Helper methods
  async getPendingMigrations() {
    const allMigrations = this.getAllMigrationFiles();
    const executedMigrations = await this.getExecutedMigrationNames();
    return allMigrations.filter(m => !executedMigrations.includes(m));
  }

  getAllMigrationFiles() {
    if (!fs.existsSync(this.migrationPath)) {
      return [];
    }

    return fs
      .readdirSync(this.migrationPath)
      .filter(file => file.endsWith('.js'))
      .sort();
  }

  async getExecutedMigrationNames() {
    const result = await this.pool.query(
      `SELECT migration FROM ${this.migrationsTable} ORDER BY id ASC`
    );
    return result.rows.map(row => row.migration);
  }

  async getExecutedMigrations(limit) {
    const result = await this.pool.query(
      `SELECT migration, batch FROM ${this.migrationsTable} 
       ORDER BY id DESC LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async getNextBatch() {
    const result = await this.pool.query(
      `SELECT COALESCE(MAX(batch), 0) + 1 as next_batch FROM ${this.migrationsTable}`
    );
    return result.rows[0].next_batch;
  }

  async recordMigration(migration, batch) {
    await this.pool.query(
      `INSERT INTO ${this.migrationsTable} (migration, batch) VALUES ($1, $2)`,
      [migration, batch]
    );
  }

  async removeMigrationRecord(migration) {
    await this.pool.query(
      `DELETE FROM ${this.migrationsTable} WHERE migration = $1`,
      [migration]
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

class QueryInterface {
  constructor(pool) {
    this.pool = pool;
  }

  async query(sql, params = []) {
    return await this.pool.query(sql, params);
  }

  // Table operations
  async createTable(tableName, callback) {
    const tableBuilder = new TableBuilder(tableName);
    callback(tableBuilder);
    const sql = tableBuilder.toSQL();
    await this.query(sql);
  }

  async dropTable(tableName) {
    await this.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
  }

  async renameTable(oldName, newName) {
    await this.query(`ALTER TABLE ${oldName} RENAME TO ${newName}`);
  }

  // Column operations
  async addColumn(tableName, columnName, type, options = {}) {
    let sql = `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${type}`;
    if (options.nullable === false) sql += ' NOT NULL';
    if (options.default !== undefined) sql += ` DEFAULT ${options.default}`;
    await this.query(sql);
  }

  async dropColumn(tableName, columnName) {
    await this.query(`ALTER TABLE ${tableName} DROP COLUMN ${columnName}`);
  }

  async renameColumn(tableName, oldName, newName) {
    await this.query(
      `ALTER TABLE ${tableName} RENAME COLUMN ${oldName} TO ${newName}`
    );
  }

  async modifyColumn(tableName, columnName, newType, options = {}) {
    let sql = `ALTER TABLE ${tableName} ALTER COLUMN ${columnName} TYPE ${newType}`;
    await this.query(sql);

    if (options.nullable === false) {
      await this.query(
        `ALTER TABLE ${tableName} ALTER COLUMN ${columnName} SET NOT NULL`
      );
    } else if (options.nullable === true) {
      await this.query(
        `ALTER TABLE ${tableName} ALTER COLUMN ${columnName} DROP NOT NULL`
      );
    }

    if (options.default !== undefined) {
      if (options.default === null) {
        await this.query(
          `ALTER TABLE ${tableName} ALTER COLUMN ${columnName} DROP DEFAULT`
        );
      } else {
        await this.query(
          `ALTER TABLE ${tableName} ALTER COLUMN ${columnName} SET DEFAULT ${options.default}`
        );
      }
    }
  }

  // Index operations
  async addIndex(tableName, columns, indexName, options = {}) {
    const columnList = Array.isArray(columns) ? columns.join(', ') : columns;
    const unique = options.unique ? 'UNIQUE ' : '';
    await this.query(
      `CREATE ${unique}INDEX ${indexName} ON ${tableName} (${columnList})`
    );
  }

  async dropIndex(indexName) {
    await this.query(`DROP INDEX IF EXISTS ${indexName}`);
  }

  // Foreign key operations
  async addForeignKey(
    tableName,
    columnName,
    referencedTable,
    referencedColumn,
    options = {}
  ) {
    const constraintName = options.name || `fk_${tableName}_${columnName}`;
    const onDelete = options.onDelete ? ` ON DELETE ${options.onDelete}` : '';
    const onUpdate = options.onUpdate ? ` ON UPDATE ${options.onUpdate}` : '';

    const sql = `ALTER TABLE ${tableName} 
                 ADD CONSTRAINT ${constraintName} 
                 FOREIGN KEY (${columnName}) 
                 REFERENCES ${referencedTable}(${referencedColumn})${onDelete}${onUpdate}`;
    await this.query(sql);
  }

  async dropForeignKey(tableName, constraintName) {
    await this.query(
      `ALTER TABLE ${tableName} DROP CONSTRAINT ${constraintName}`
    );
  }
}

// Laravel-style Table Builder
class TableBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.columns = [];
    this.indexes = [];
    this.foreignKeys = [];
  }

  id(columnName = 'id') {
    this.columns.push(`${columnName} SERIAL PRIMARY KEY`);
    return this;
  }

  string(columnName, length = 255) {
    this.columns.push(`${columnName} VARCHAR(${length})`);
    return this;
  }

  text(columnName) {
    this.columns.push(`${columnName} TEXT`);
    return this;
  }

  integer(columnName) {
    this.columns.push(`${columnName} INTEGER`);
    return this;
  }

  boolean(columnName) {
    this.columns.push(`${columnName} BOOLEAN DEFAULT FALSE`);
    return this;
  }

  timestamp(columnName) {
    this.columns.push(`${columnName} TIMESTAMP`);
    return this;
  }

  timestamps() {
    this.columns.push('created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    this.columns.push('updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
    return this;
  }

  unique(columnName) {
    this.indexes.push(`UNIQUE(${columnName})`);
    return this;
  }

  index(columnName, indexName) {
    this.indexes.push({ column: columnName, name: indexName });
    return this;
  }

  foreign(columnName) {
    return {
      references: referencedColumn => {
        return {
          on: referencedTable => {
            this.foreignKeys.push(
              `FOREIGN KEY (${columnName}) REFERENCES ${referencedTable}(${referencedColumn})`
            );
            return this;
          }
        };
      }
    };
  }

  toSQL() {
    let sql = `CREATE TABLE ${this.tableName} (\n`;
    sql += '  ' + this.columns.join(',\n  ');

    if (this.indexes.length > 0) {
      const uniqueIndexes = this.indexes.filter(idx => typeof idx === 'string');
      if (uniqueIndexes.length > 0) {
        sql += ',\n  ' + uniqueIndexes.join(',\n  ');
      }
    }

    if (this.foreignKeys.length > 0) {
      sql += ',\n  ' + this.foreignKeys.join(',\n  ');
    }

    sql += '\n);';

    // Add regular indexes separately
    const regularIndexes = this.indexes.filter(idx => typeof idx === 'object');
    regularIndexes.forEach(idx => {
      sql += `\nCREATE INDEX ${idx.name} ON ${this.tableName}(${idx.column});`;
    });

    return sql;
  }
}

module.exports = { MigrationRunner, QueryInterface };
