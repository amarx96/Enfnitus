const fs = require('fs');
const path = require('path');
const database = require('./src/config/database');
const logger = require('./src/utils/logger');

async function runMigration() {
  try {
    logger.info('Connecting to database...');
    const pool = await database.connect();
    
    if (!pool) {
      logger.error('Database connection failed. Cannot run migration.');
      process.exit(1);
    }
    
    const sqlPath = path.join(__dirname, 'PRICING_MARGINS.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    logger.info('Executing PRICING_MARGINS.sql...');
    await database.query(sql);
    
    logger.info('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
