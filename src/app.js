const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { testConnection } = require('./config/supabase');

// Route-Imports
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const pricingRoutes = require('./routes/pricing');
const contractingRoutes = require('./routes/contracting');
const voucherRoutes = require('./routes/voucher');

const app = express();

// Security Middleware
app.use(helmet());

// CORS Configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:3002').split(',');

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      callback(new Error(msg), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100, // Max 100 Requests pro IP
  message: {
    erfolg: false,
    nachricht: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.',
    fehlerCode: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  next();
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    erfolg: true,
    nachricht: 'EVU Backend läuft',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      backend: 'running',
      database: process.env.NODE_ENV === 'development' ? 'disabled' : 'connected',
      pricing: 'active'
    }
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/kunden', customerRoutes);
app.use('/api/v1/tarife', pricingRoutes);
app.use('/api/v1/pricing', pricingRoutes); // Alias for frontend compatibility
app.use('/api/v1/vertraege', contractingRoutes);
app.use('/api/v1/voucher', voucherRoutes);

// Health Check Endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'enfinitus-energie-backend',
    version: '1.0.0'
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    erfolg: false,
    nachricht: 'Endpunkt nicht gefunden',
    pfad: req.originalUrl,
    verfuegbareEndpunkte: [
      '/api/v1/auth',
      '/api/v1/kunden', 
      '/api/v1/tarife',
      '/api/v1/vertraege'
    ]
  });
});

// Error Handler
app.use(errorHandler);

// Initialize Supabase connection
async function initializeDatabase() {
  try {
    logger.info('🔗 Initializing database connection...');
    const connected = await testConnection();
    if (connected) {
      logger.info('✅ Supabase database connected successfully');
    } else {
      logger.warn('⚠️  Supabase connection test failed - continuing without database');
    }
  } catch (error) {
    logger.error('❌ Database initialization error:', error.message);
  }
}

// Test database connection on startup
initializeDatabase();

// Graceful Shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM empfangen. Server wird heruntergefahren...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT empfangen. Server wird heruntergefahren...');
  process.exit(0);
});

module.exports = app;