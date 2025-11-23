const fs = require('fs');
const path = require('path');
const database = require('./src/config/database');
const logger = require('./src/utils/logger');

async function runMigration(filename) {
  const sqlPath = path.join(__dirname, filename);
  if (!fs.existsSync(sqlPath)) {
      logger.error(`File not found: ${filename}`);
      return;
  }
  const sql = fs.readFileSync(sqlPath, 'utf8');
  logger.info(`Executing ${filename}...`);
  await database.query(sql);
  logger.info(`Completed ${filename}`);
}

async function migrateAll() {
  try {
    logger.info('Connecting to database...');
    const pool = await database.connect();
    
    if (!pool) {
      logger.error('Database connection failed. Cannot run migrations.');
      process.exit(1);
    }
    
    // Run migrations in order
    await runMigration('CONTRACTING_SERVICE_SCHEMA.sql');
    await runMigration('MARKETING_CAMPAIGNS.sql');
    await runMigration('PRICING_MARGINS.sql');
    await runMigration('PRICING_HISTORY.sql');
    
    logger.info('All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateAll();
