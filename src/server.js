const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

// Import routes
const pricingRoutes = require('./routes/pricing');
const contractingRoutes = require('./routes/contracting');
const customerRoutes = require('./routes/customer');
const authRoutes = require('./routes/auth');
const voucherRoutes = require('./routes/voucher');
const internalRoutes = require('./routes/internal');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
// CORS configuration
const corsOptions = {
  origin: function(origin, callback) {
    const allowed = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all localhost
    if (process.env.NODE_ENV === 'development' || origin.includes('localhost')) {
      return callback(null, true);
    }
    
    if (allowed.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Enfinitus Energie EVU API',
      version: '1.0.0',
      description: 'Backend API for Enfinitus Energie - Vietnamese community energy supplier',
      contact: {
        name: 'Enfinitus Energie',
        email: 'tech@enfinitus-energie.de'
      }
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/models/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
const apiRouter = express.Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/pricing', pricingRoutes);
apiRouter.use('/contracting', contractingRoutes);
apiRouter.use('/customers', customerRoutes);
apiRouter.use('/voucher', voucherRoutes);
apiRouter.use('/internal', internalRoutes);

// Legacy route aliases for backward compatibility
apiRouter.use('/tarife', pricingRoutes);

app.use('/api/v1', apiRouter);
app.use('/api', voucherRoutes); // Mount voucher routes at /api level too

// Serve frontend static files
const path = require('path');
const frontendBuildPath = path.join(__dirname, '../frontend/build');
console.log('Frontend build path:', frontendBuildPath);

// Serve static files from build folder
app.use(express.static(frontendBuildPath));

// Serve React app for all non-API routes (this will handle routing)
app.get('*', (req, res) => {
  console.log('Catch-all route hit for:', req.path);
  
  // Don't serve frontend for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'Route not found',
      path: req.originalUrl
    });
  }
  
  // For all other routes, serve the React app
  const indexPath = path.join(frontendBuildPath, 'index.html');
  console.log('Serving index.html from:', indexPath);
  res.sendFile(indexPath);
});

// 404 handler for API routes only  
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Enfinitus Energie EVU Backend server running on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;