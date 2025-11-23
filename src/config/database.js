const { Pool } = require('pg');
const logger = require('../utils/logger');

class Database {
  constructor() {
    this.pool = null;
    
    // Fallback credentials provided by user (Canonical DB Host)
    const FALLBACK_DB_URL = 'postgresql://postgres:Rc0MddBugC0svZGZ@db.lorqrxsqgvpjjxfbqugy.supabase.co:5432/postgres';
    
    const hasDbHost = !!process.env.DB_HOST;
    const hasDbUrl = !!process.env.DATABASE_URL;
    
    this.dbEnabled = process.env.DB_ENABLED !== 'false';
    
    if (this.dbEnabled) {
      if (hasDbUrl || !hasDbHost) {
        const connectionString = process.env.DATABASE_URL || FALLBACK_DB_URL;
        logger.info(`Using Database Connection String (masked): ${connectionString.replace(/:[^:@]*@/, ':****@')}`);
        this.config = {
          connectionString: connectionString,
          ssl: { rejectUnauthorized: false }, // Supabase usually requires SSL
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        };
      } else {
        this.config = {
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT) || 5432,
          database: process.env.DB_NAME,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          ssl: process.env.DB_SSL === 'true' ? {
            rejectUnauthorized: false
          } : false,
          max: 20, 
          idleTimeoutMillis: 30000, 
          connectionTimeoutMillis: 5000, 
        };
      }
    } else {
      logger.warn(`Database disabled. DB_ENABLED=${process.env.DB_ENABLED}, DB_HOST=${hasDbHost ? 'Set' : 'Missing'}, DATABASE_URL=${hasDbUrl ? 'Set' : 'Missing'}`);
    }
  }

  async connect() {
    if (!this.dbEnabled) {
      logger.info('Skipping database connection - running in development mode');
      return null;
    }

    // If pool already exists, return it
    if (this.pool) {
      return this.pool;
    }
    
    try {
      this.pool = new Pool(this.config);
      
      // Test the connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      logger.info('Successfully connected to Supabase PostgreSQL database');
      return this.pool;
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      // Return null to allow services to fallback to mock mode
      return null;
    }
  }

  async query(text, params) {
    if (!this.dbEnabled || !this.pool) {
      logger.warn('Database query attempted but database is disabled');
      return { rows: [], rowCount: 0 };
    }
    
    try {
      const start = Date.now();
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;
      
      logger.debug(`Executed query in ${duration}ms: ${text}`);
      return result;
    } catch (error) {
      logger.error('Database query error:', error);
      throw error;
    }
  }

  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      logger.info('Database connection pool closed');
    }
  }

  getPool() {
    return this.pool;
  }
}

// Create singleton instance
const database = new Database();

module.exports = database;