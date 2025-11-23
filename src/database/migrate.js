const database = require('../config/database');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

async function migrate() {
  try {
    // Connect to database
    await database.connect();
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    logger.info('Starting database migration...');
    await database.query(schema);
    logger.info('Database migration completed successfully');
    
    // Close connection
    await database.close();
    
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate();
}

module.exports = migrate;