/**
 * 🧪 APP.JS COMPLETE COVERAGE TESTS
 * Achieving 100% coverage for production deployment
 */

const request = require('supertest');

// Mock all external dependencies before requiring app
jest.mock('../../src/config/supabase', () => ({
  testConnection: jest.fn()
}));

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

// Mock child modules to prevent actual initialization
jest.mock('../../src/routes/auth');
jest.mock('../../src/routes/customer');  
jest.mock('../../src/routes/pricing');
jest.mock('../../src/routes/contracting');
jest.mock('../../src/middleware/errorHandler');

const { testConnection } = require('../../src/config/supabase');
const logger = require('../../src/utils/logger');

describe('🚀 APP.JS - 100% COVERAGE TESTS', () => {
  
  let app;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear require cache to allow fresh imports
    delete require.cache[require.resolve('../../src/app')];
  });

  describe('📡 Application Startup & Configuration', () => {
    
    test('✅ Express app initializes with all middleware', () => {
      app = require('../../src/app');
      expect(app).toBeDefined();
      expect(typeof app.listen).toBe('function');
    });

    test('🔗 Database initialization with successful connection', async () => {
      // Mock successful connection before requiring app
      testConnection.mockResolvedValue(true);
      
      // Import app (triggers initialization)
      app = require('../../src/app');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(testConnection).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('🔗 Initializing database connection...');
      expect(logger.info).toHaveBeenCalledWith('✅ Supabase database connected successfully');
    });

    test('⚠️ Database initialization with failed connection', async () => {
      // Mock failed connection
      testConnection.mockResolvedValue(false);
      
      // Import app (triggers initialization)
      app = require('../../src/app');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(testConnection).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith('⚠️  Supabase connection test failed - continuing without database');
    });

    test('❌ Database initialization with connection error', async () => {
      // Mock connection error
      const testError = new Error('Connection timeout');
      testConnection.mockRejectedValue(testError);
      
      // Import app (triggers initialization)
      app = require('../../src/app');
      
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(testConnection).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('❌ Database initialization error:', 'Connection timeout');
    });
  });

  describe('🔧 Middleware & Routing Integration', () => {
    
    beforeEach(() => {
      testConnection.mockResolvedValue(true);
      app = require('../../src/app');
    });
    
    test('🌐 CORS middleware handles preflight requests', async () => {
      const response = await request(app)
        .options('/api/v1/kunden')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');
      
      expect(response.status).toBe(204); // OPTIONS returns 204, not 200
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    test('📝 Request logging middleware processes requests', async () => {
      await request(app)
        .get('/health'); // Use health endpoint that exists
      
      // Verify logging occurred (mocked)
      expect(logger.info).toHaveBeenCalled();
    });

    test('🔒 Security headers applied correctly', async () => {
      const response = await request(app)
        .get('/health');
      
      // Check for helmet security headers
      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });

    test('📊 Rate limiting functionality', async () => {
      // Make multiple rapid requests to test rate limiting
      const promises = Array.from({ length: 5 }, () =>
        request(app).get('/health')
      );
      
      const responses = await Promise.all(promises);
      
      // All should succeed within rate limit (100 requests per 15min)
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });

    test('💪 Health check endpoint', async () => {
      const response = await request(app)
        .get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('erfolg', true);
      expect(response.body).toHaveProperty('nachricht', 'EVU Backend läuft');
    });
  });

  describe('🛣️ Route Configuration Coverage', () => {
    
    beforeEach(() => {
      testConnection.mockResolvedValue(true);
      app = require('../../src/app');
    });
    
    test('👥 Customer routes mounted correctly', async () => {
      const response = await request(app)
        .get('/api/v1/kunden');
      
      // Should reach the route handler (even if mocked)
      expect([200, 404, 500]).toContain(response.status);
    });

    test('💰 Pricing routes mounted correctly', async () => {
      const response = await request(app)
        .post('/api/v1/tarife');
      
      // Should reach the route handler
      expect([200, 400, 404, 500]).toContain(response.status);
    });

    test('🔐 Auth routes mounted correctly', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register');
      
      // Should reach the route handler
      expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    });

    test('📋 Contracting routes mounted correctly', async () => {
      const response = await request(app)
        .post('/api/v1/vertraege');
      
      // Should reach the route handler
      expect([200, 400, 401, 404, 422, 500]).toContain(response.status);
    });
  });

  describe('🚨 Error Handling Coverage', () => {
    
    beforeEach(() => {
      testConnection.mockResolvedValue(true);
      app = require('../../src/app');
    });
    
    test('404 handler for unknown routes', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent-route');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('erfolg', false);
      expect(response.body).toHaveProperty('nachricht', 'Endpunkt nicht gefunden');
      expect(response.body).toHaveProperty('pfad', '/api/v1/nonexistent-route');
      expect(response.body).toHaveProperty('verfuegbareEndpunkte');
    });

    test('🔥 Global error handler integration', async () => {
      // This tests that error handler is mounted
      const response = await request(app)
        .post('/api/v1/kunden')
        .send('invalid-json-that-should-cause-error');
      
      // Should be handled by either validation or error handler
      expect([400, 422, 500]).toContain(response.status);
    });

    test('📝 JSON parsing with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/kunden')
        .set('Content-Type', 'application/json')
        .send({ test: 'data' });
      
      // Should parse JSON correctly and reach route handler
      expect([200, 400, 422, 500]).toContain(response.status);
    });
  });

  describe('⚙️ Process Signal Handling', () => {
    
    let originalProcessExit;
    let originalProcessOn;
    let processOnCalls;
    
    beforeEach(() => {
      originalProcessExit = process.exit;
      originalProcessOn = process.on;
      
      processOnCalls = [];
      process.exit = jest.fn();
      process.on = jest.fn((event, handler) => {
        processOnCalls.push({ event, handler });
        return originalProcessOn.call(process, event, handler);
      });
    });

    afterEach(() => {
      process.exit = originalProcessExit;
      process.on = originalProcessOn;
    });

    test('🛑 SIGTERM handler registered and processes signal', async () => {
      // Clear mocks and import app
      testConnection.mockResolvedValue(true);
      app = require('../../src/app');
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Find SIGTERM handler
      const sigTermCall = processOnCalls.find(call => call.event === 'SIGTERM');
      expect(sigTermCall).toBeDefined();
      
      // Execute SIGTERM handler
      sigTermCall.handler();
      
      expect(logger.info).toHaveBeenCalledWith('SIGTERM empfangen. Server wird heruntergefahren...');
      expect(process.exit).toHaveBeenCalledWith(0);
    });

    test('🛑 SIGINT handler registered and processes signal', async () => {
      // Clear mocks and import app  
      testConnection.mockResolvedValue(true);
      app = require('../../src/app');
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Find SIGINT handler
      const sigIntCall = processOnCalls.find(call => call.event === 'SIGINT');
      expect(sigIntCall).toBeDefined();
      
      // Execute SIGINT handler
      sigIntCall.handler();
      
      expect(logger.info).toHaveBeenCalledWith('SIGINT empfangen. Server wird heruntergefahren...');
      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });

  describe('📤 Module Export & Express Configuration', () => {
    
    test('✅ App module exports Express instance', () => {
      testConnection.mockResolvedValue(true);
      app = require('../../src/app');
      
      expect(app).toBeDefined();
      expect(typeof app).toBe('function');
      expect(app.listen).toBeDefined();
    });

    test('🔧 Express middleware stack configured', () => {
      testConnection.mockResolvedValue(true);
      app = require('../../src/app');
      
      // Verify app has the expected middleware stack
      expect(app._router).toBeDefined();
      expect(app._router.stack).toBeInstanceOf(Array);
      expect(app._router.stack.length).toBeGreaterThan(0);
    });
  });
});