const logger = require('../../src/utils/logger');

// Mock console methods
const originalConsole = console;
let mockConsole;

describe('🎯 100% Coverage Logger Tests', () => {
  beforeEach(() => {
    mockConsole = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    };
    
    // Replace console methods
    Object.assign(console, mockConsole);
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original console
    Object.assign(console, originalConsole);
  });

  describe('Logger Function Coverage', () => {
    test('sollte info() logging vollständig abdecken', () => {
      // Simple info message
      logger.info('Test info message');
      expect(mockConsole.log).toHaveBeenCalled();

      // Info with metadata
      logger.info('Info with metadata', { userId: '123', action: 'login' });
      expect(mockConsole.log).toHaveBeenCalledTimes(2);

      // Info with complex object
      logger.info('Complex info', {
        user: { id: '123', email: 'test@example.com' },
        timestamp: new Date(),
        details: { ip: '192.168.1.1', userAgent: 'Test Browser' }
      });
      expect(mockConsole.log).toHaveBeenCalledTimes(3);
    });

    test('sollte error() logging vollständig abdecken', () => {
      // Simple error message
      logger.error('Test error message');
      expect(mockConsole.error).toHaveBeenCalled();

      // Error with Error object
      const testError = new Error('Test error');
      logger.error('Error occurred', testError);
      expect(mockConsole.error).toHaveBeenCalledTimes(2);

      // Error with metadata
      logger.error('Error with metadata', { 
        error: testError.message, 
        stack: testError.stack,
        userId: '456' 
      });
      expect(mockConsole.error).toHaveBeenCalledTimes(3);

      // Error with string error
      logger.error('String error', 'Simple error message');
      expect(mockConsole.error).toHaveBeenCalledTimes(4);
    });

    test('sollte warn() logging vollständig abdecken', () => {
      // Simple warning
      logger.warn('Test warning');
      expect(mockConsole.warn).toHaveBeenCalled();

      // Warning with context
      logger.warn('Performance warning', { 
        duration: 1500, 
        threshold: 1000,
        endpoint: '/api/slow-endpoint'
      });
      expect(mockConsole.warn).toHaveBeenCalledTimes(2);

      // Security warning
      logger.warn('Security warning', {
        ip: '192.168.1.100',
        attempts: 5,
        timeWindow: '5 minutes'
      });
      expect(mockConsole.warn).toHaveBeenCalledTimes(3);
    });

    test('sollte debug() logging vollständig abdecken', () => {
      // Simple debug message
      logger.debug('Debug message');
      expect(mockConsole.log).toHaveBeenCalled();

      // Debug with detailed data
      logger.debug('Database query debug', {
        query: 'SELECT * FROM users WHERE id = $1',
        params: ['123'],
        executionTime: 45
      });
      expect(mockConsole.log).toHaveBeenCalledTimes(2);

      // Debug with nested objects
      logger.debug('Complex debug data', {
        request: {
          method: 'POST',
          url: '/api/auth/login',
          headers: { 'content-type': 'application/json' },
          body: { email: 'test@example.com' }
        },
        response: {
          status: 200,
          headers: { 'set-cookie': 'session=abc123' },
          duration: 150
        }
      });
      expect(mockConsole.log).toHaveBeenCalledTimes(3);
    });

    test('sollte alle Log-Level-Kombinationen abdecken', () => {
      const logLevels = ['info', 'error', 'warn', 'debug'];
      const testMessages = [
        'Simple message',
        'Message with metadata',
        'Complex message with nested data'
      ];

      logLevels.forEach(level => {
        testMessages.forEach((message, index) => {
          const metadata = index === 1 ? { key: 'value' } : 
                          index === 2 ? { nested: { data: 'complex' } } : 
                          undefined;
          
          logger[level](message, metadata);
        });
      });

      // Verify all log methods were called
      expect(mockConsole.log).toHaveBeenCalled(); // info and debug
      expect(mockConsole.error).toHaveBeenCalled();
      expect(mockConsole.warn).toHaveBeenCalled();
    });

    test('sollte Edge-Cases und Sonderfälle abdecken', () => {
      // Null/undefined messages
      logger.info(null);
      logger.info(undefined);
      logger.info('');
      expect(mockConsole.log).toHaveBeenCalledTimes(3);

      // Null/undefined metadata
      logger.error('Error message', null);
      logger.error('Error message', undefined);
      expect(mockConsole.error).toHaveBeenCalledTimes(2);

      // Very long messages
      const longMessage = 'A'.repeat(1000);
      logger.info(longMessage);
      expect(mockConsole.log).toHaveBeenCalledTimes(4);

      // Circular reference in metadata (should handle gracefully)
      const circularObj = { name: 'circular' };
      circularObj.self = circularObj;
      logger.info('Circular object test', circularObj);
      expect(mockConsole.log).toHaveBeenCalledTimes(5);

      // Special characters and Unicode
      logger.info('Unicode test: äöü ñ 中文 🚀', { emoji: '💻', special: 'äöüß' });
      expect(mockConsole.log).toHaveBeenCalledTimes(6);
    });

    test('sollte Timestamp-Formatting abdecken', () => {
      // Mock Date to have consistent timestamps in tests
      const fixedDate = new Date('2024-11-02T10:30:00.000Z');
      const originalDate = Date;
      
      global.Date = jest.fn(() => fixedDate);
      global.Date.now = jest.fn(() => fixedDate.getTime());

      logger.info('Timestamp test');
      
      // Restore original Date
      global.Date = originalDate;
      
      expect(mockConsole.log).toHaveBeenCalled();
    });

    test('sollte Performance bei großen Objekten testen', () => {
      // Large object logging performance
      const largeObject = {
        users: Array(1000).fill().map((_, i) => ({
          id: i,
          email: `user${i}@example.com`,
          data: { field1: 'value1', field2: 'value2', field3: 'value3' }
        })),
        metadata: {
          totalUsers: 1000,
          processed: new Date(),
          performance: {
            dbQuery: 150,
            serialization: 50,
            totalTime: 200
          }
        }
      };

      const startTime = Date.now();
      logger.info('Large object test', largeObject);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be fast
      expect(mockConsole.log).toHaveBeenCalled();
    });

    test('sollte Error-Object-Serialization abdecken', () => {
      // Different types of errors
      const standardError = new Error('Standard error');
      const typeError = new TypeError('Type error');
      const rangeError = new RangeError('Range error');
      const customError = {
        name: 'CustomError',
        message: 'Custom error message',
        code: 'CUSTOM_001',
        details: { field: 'value' }
      };

      logger.error('Standard error test', standardError);
      logger.error('Type error test', typeError);
      logger.error('Range error test', rangeError);
      logger.error('Custom error test', customError);

      expect(mockConsole.error).toHaveBeenCalledTimes(4);
    });

    test('sollte verschiedene Datentypen in Metadata abdecken', () => {
      const testMetadata = {
        string: 'test string',
        number: 42,
        boolean: true,
        array: [1, 2, 3, 'array item'],
        object: { nested: { deep: 'value' } },
        date: new Date(),
        null: null,
        undefined: undefined,
        function: () => 'test function',
        symbol: Symbol('test symbol')
      };

      logger.info('Data types test', testMetadata);
      expect(mockConsole.log).toHaveBeenCalled();
    });

    test('sollte Log-Format-Konsistenz prüfen', () => {
      // Test consistent log format across different scenarios
      const scenarios = [
        { message: 'Simple log', metadata: undefined },
        { message: 'Log with metadata', metadata: { key: 'value' } },
        { message: 'Log with error', metadata: new Error('Test error') },
        { message: 'Log with array', metadata: [1, 2, 3] },
        { message: 'Log with complex object', metadata: { 
          user: { id: 1, name: 'Test' },
          action: 'login',
          timestamp: new Date()
        }}
      ];

      scenarios.forEach((scenario, index) => {
        logger.info(scenario.message, scenario.metadata);
      });

      expect(mockConsole.log).toHaveBeenCalledTimes(scenarios.length);
    });
  });

  describe('Logger Configuration Coverage', () => {
    test('sollte alle exportierten Funktionen verfügbar haben', () => {
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    test('sollte Logger-Modul korrekt exportieren', () => {
      expect(logger).toBeDefined();
      expect(typeof logger).toBe('object');
      
      const expectedMethods = ['info', 'error', 'warn', 'debug'];
      expectedMethods.forEach(method => {
        expect(logger).toHaveProperty(method);
        expect(typeof logger[method]).toBe('function');
      });
    });
  });
});