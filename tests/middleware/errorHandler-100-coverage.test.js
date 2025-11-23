const errorHandler = require('../../src/middleware/errorHandler');

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}));

const logger = require('../../src/utils/logger');

describe('🎯 100% Coverage Error Handler Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      url: '/api/test',
      ip: '192.168.1.1',
      headers: {
        'user-agent': 'Test Browser',
        'x-request-id': 'test-request-123'
      }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      headersSent: false
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('Error Type Coverage', () => {
    test('sollte Standard JavaScript Errors handhaben', () => {
      const standardError = new Error('Standard error message');
      
      errorHandler(standardError, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        erfolg: false,
        nachricht: 'Ein interner Serverfehler ist aufgetreten',
        fehlerCode: 'INTERNAL_SERVER_ERROR',
        zeitstempel: expect.any(String)
      });
      expect(logger.error).toHaveBeenCalled();
    });

    test('sollte ValidationError handhaben', () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.details = [
        { path: ['email'], message: 'Email ist erforderlich' },
        { path: ['password'], message: 'Passwort zu schwach' }
      ];
      
      errorHandler(validationError, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        erfolg: false,
        nachricht: 'Validierungsfehler',
        fehlerCode: 'VALIDATION_ERROR',
        details: validationError.details,
        zeitstempel: expect.any(String)
      });
    });

    test('sollte UnauthorizedError handhaben', () => {
      const unauthorizedError = new Error('Access denied');
      unauthorizedError.name = 'UnauthorizedError';
      unauthorizedError.statusCode = 401;
      
      errorHandler(unauthorizedError, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        erfolg: false,
        nachricht: 'Zugriff verweigert',
        fehlerCode: 'UNAUTHORIZED',
        zeitstempel: expect.any(String)
      });
    });

    test('sollte ForbiddenError handhaben', () => {
      const forbiddenError = new Error('Forbidden');
      forbiddenError.name = 'ForbiddenError';
      forbiddenError.statusCode = 403;
      
      errorHandler(forbiddenError, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        erfolg: false,
        nachricht: 'Zugriff verweigert',
        fehlerCode: 'FORBIDDEN',
        zeitstempel: expect.any(String)
      });
    });

    test('sollte NotFoundError handhaben', () => {
      const notFoundError = new Error('Resource not found');
      notFoundError.name = 'NotFoundError';
      notFoundError.statusCode = 404;
      
      errorHandler(notFoundError, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        erfolg: false,
        nachricht: 'Ressource nicht gefunden',
        fehlerCode: 'NOT_FOUND',
        zeitstempel: expect.any(String)
      });
    });

    test('sollte ConflictError handhaben', () => {
      const conflictError = new Error('Resource conflict');
      conflictError.name = 'ConflictError';
      conflictError.statusCode = 409;
      
      errorHandler(conflictError, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith({
        erfolg: false,
        nachricht: 'Konflikt bei der Ressourcenbearbeitung',
        fehlerCode: 'CONFLICT',
        zeitstempel: expect.any(String)
      });
    });

    test('sollte DatabaseError handhaben', () => {
      const dbError = new Error('Database connection failed');
      dbError.name = 'DatabaseError';
      dbError.code = 'ECONNREFUSED';
      
      errorHandler(dbError, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        erfolg: false,
        nachricht: 'Datenbankfehler',
        fehlerCode: 'DATABASE_ERROR',
        zeitstempel: expect.any(String)
      });
      expect(logger.error).toHaveBeenCalledWith(
        'Database Error:',
        expect.objectContaining({
          name: 'DatabaseError',
          message: 'Database connection failed',
          code: 'ECONNREFUSED'
        })
      );
    });

    test('sollte TimeoutError handhaben', () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      timeoutError.timeout = 5000;
      
      errorHandler(timeoutError, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(408);
      expect(mockRes.json).toHaveBeenCalledWith({
        erfolg: false,
        nachricht: 'Anfrage-Timeout',
        fehlerCode: 'TIMEOUT',
        zeitstempel: expect.any(String)
      });
    });

    test('sollte RateLimitError handhaben', () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.name = 'RateLimitError';
      rateLimitError.statusCode = 429;
      rateLimitError.retryAfter = 60;
      
      errorHandler(rateLimitError, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        erfolg: false,
        nachricht: 'Zu viele Anfragen',
        fehlerCode: 'RATE_LIMIT_EXCEEDED',
        retryAfter: 60,
        zeitstempel: expect.any(String)
      });
    });
  });

  describe('Error Status Code Coverage', () => {
    test('sollte Error mit explizitem statusCode verwenden', () => {
      const customError = new Error('Custom error');
      customError.statusCode = 422;
      
      errorHandler(customError, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(422);
    });

    test('sollte Error mit status property verwenden', () => {
      const customError = new Error('Custom error');
      customError.status = 418; // I'm a teapot
      
      errorHandler(customError, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(418);
    });

    test('sollte statusCode über status property priorisieren', () => {
      const customError = new Error('Custom error');
      customError.statusCode = 422;
      customError.status = 400;
      
      errorHandler(customError, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(422);
    });

    test('sollte Standard 500 für Errors ohne Status verwenden', () => {
      const simpleError = new Error('Simple error');
      
      errorHandler(simpleError, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Error Response Coverage', () => {
    test('sollte bereits gesendete Responses handhaben', () => {
      mockRes.headersSent = true;
      const error = new Error('Error after headers sent');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });

    test('sollte Production Environment Error-Details verstecken', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Sensitive error information');
      error.stack = 'Error: Sensitive info\n  at /path/to/file:123:45';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.not.objectContaining({
          stack: expect.any(String),
          sensitiveInfo: expect.any(String)
        })
      );
      
      process.env.NODE_ENV = originalEnv;
    });

    test('sollte Development Environment Error-Details zeigen', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Development error');
      error.stack = 'Error: Development error\n  at /dev/path:123:45';
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith(
        'Error Details:',
        expect.objectContaining({
          message: 'Development error',
          stack: expect.stringContaining('Error: Development error')
        })
      );
      
      process.env.NODE_ENV = originalEnv;
    });

    test('sollte Request-Context in Logs einschließen', () => {
      const error = new Error('Context test error');
      
      errorHandler(error, mockReq, mockRes, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith(
        'Request Context:',
        expect.objectContaining({
          method: 'GET',
          url: '/api/test',
          ip: '192.168.1.1',
          userAgent: 'Test Browser',
          requestId: 'test-request-123'
        })
      );
    });
  });

  describe('Logging Coverage', () => {
    test('sollte verschiedene Log-Level für verschiedene Error-Schweregrade verwenden', () => {
      // Warning-level errors
      const warningError = new Error('Warning level error');
      warningError.statusCode = 400;
      
      errorHandler(warningError, mockReq, mockRes, mockNext);
      expect(logger.warn).toHaveBeenCalled();
      
      jest.clearAllMocks();
      
      // Error-level errors
      const criticalError = new Error('Critical error');
      criticalError.statusCode = 500;
      
      errorHandler(criticalError, mockReq, mockRes, mockNext);
      expect(logger.error).toHaveBeenCalled();
    });

    test('sollte Error-Metadata in Logs einschließen', () => {
      const errorWithMetadata = new Error('Error with metadata');
      errorWithMetadata.userId = 'user123';
      errorWithMetadata.transactionId = 'tx456';
      errorWithMetadata.timestamp = new Date().toISOString();
      
      errorHandler(errorWithMetadata, mockReq, mockRes, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          userId: 'user123',
          transactionId: 'tx456',
          timestamp: expect.any(String)
        })
      );
    });

    test('sollte Error-Chain für nested Errors loggen', () => {
      const rootCause = new Error('Root cause error');
      const middleError = new Error('Middle error');
      middleError.cause = rootCause;
      const topError = new Error('Top level error');
      topError.cause = middleError;
      
      errorHandler(topError, mockReq, mockRes, mockNext);
      
      expect(logger.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          message: 'Top level error',
          cause: expect.objectContaining({
            message: 'Middle error'
          })
        })
      );
    });
  });

  describe('Edge Cases Coverage', () => {
    test('sollte null/undefined Errors handhaben', () => {
      errorHandler(null, mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(500);
      
      jest.clearAllMocks();
      
      errorHandler(undefined, mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test('sollte String Errors handhaben', () => {
      errorHandler('String error message', mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          nachricht: 'Ein interner Serverfehler ist aufgetreten'
        })
      );
    });

    test('sollte Object Errors handhaben', () => {
      const objectError = {
        message: 'Object error',
        code: 'OBJ_ERROR',
        statusCode: 422
      };
      
      errorHandler(objectError, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(422);
    });

    test('sollte Error ohne message property handhaben', () => {
      const errorWithoutMessage = new Error();
      errorWithoutMessage.name = 'CustomError';
      delete errorWithoutMessage.message;
      
      errorHandler(errorWithoutMessage, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalled();
    });

    test('sollte sehr lange Error-Messages handhaben', () => {
      const longMessage = 'A'.repeat(10000);
      const longError = new Error(longMessage);
      
      errorHandler(longError, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalled();
    });

    test('sollte Error mit circular references handhaben', () => {
      const circularError = new Error('Circular error');
      circularError.self = circularError;
      
      errorHandler(circularError, mockReq, mockRes, mockNext);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(logger.error).toHaveBeenCalled();
    });

    test('sollte Fehler beim JSON-Serialization handhaben', () => {
      const problematicError = new Error('JSON problem');
      
      // Mock res.json to throw an error
      mockRes.json.mockImplementation(() => {
        throw new Error('JSON serialization failed');
      });
      
      errorHandler(problematicError, mockReq, mockRes, mockNext);
      
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Performance Coverage', () => {
    test('sollte Performance bei vielen gleichzeitigen Errors testen', () => {
      const errors = Array(100).fill().map((_, i) => 
        new Error(`Error ${i}`)
      );
      
      const startTime = Date.now();
      
      errors.forEach(error => {
        const mockReqCopy = { ...mockReq };
        const mockResCopy = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          headersSent: false
        };
        
        errorHandler(error, mockReqCopy, mockResCopy, mockNext);
      });
      
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // Unter 1 Sekunde
    });

    test('sollte Memory-Leaks bei Error-Handling vermeiden', () => {
      const startMemory = process.memoryUsage().heapUsed;
      
      // Process many errors
      for (let i = 0; i < 1000; i++) {
        const error = new Error(`Memory test error ${i}`);
        error.largeData = 'X'.repeat(1000);
        
        errorHandler(error, mockReq, {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
          headersSent: false
        }, mockNext);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const endMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = endMemory - startMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Error Handler Module Coverage', () => {
    test('sollte Error Handler Funktion korrekt exportieren', () => {
      expect(typeof errorHandler).toBe('function');
      expect(errorHandler.length).toBe(4); // err, req, res, next
    });

    test('sollte als Express Error Middleware funktionieren', () => {
      // Verify it works as Express middleware
      const error = new Error('Express middleware test');
      
      expect(() => {
        errorHandler(error, mockReq, mockRes, mockNext);
      }).not.toThrow();
      
      expect(mockRes.status).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalled();
    });
  });
});