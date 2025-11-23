const { authentifizierung } = require('../../src/middleware/auth');
const jwt = require('jsonwebtoken');
const database = require('../../src/config/database');

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../src/config/database');
jest.mock('../../src/utils/logger');

describe('🎯 100% Coverage Auth Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
      header: jest.fn(),
      get: jest.fn()
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('Token Extraction Coverage', () => {
    test('sollte Token aus Authorization header extrahieren', async () => {
      // Arrange
      const testToken = 'valid.jwt.token';
      const decodedToken = { kundenId: 'test_kunde_123' };
      const testUser = {
        kunden_id: 'test_kunde_123',
        email: 'test@example.com',
        ist_aktiv: true
      };

      mockReq.headers.authorization = `Bearer ${testToken}`;
      jwt.verify.mockReturnValue(decodedToken);
      database.query.mockResolvedValue({ rows: [testUser] });

      // Act
      await authentifizierung(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.benutzer).toEqual(testUser);
    });

    test('sollte Token aus header() Funktion extrahieren', async () => {
      // Coverage für req.header() Aufruf
      const testToken = 'another.valid.token';
      const decodedToken = { kundenId: 'kunde_456' };
      const testUser = { kunden_id: 'kunde_456', ist_aktiv: true };

      mockReq.header.mockReturnValue(`Bearer ${testToken}`);
      jwt.verify.mockReturnValue(decodedToken);
      database.query.mockResolvedValue({ rows: [testUser] });

      // Act
      await authentifizierung(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReq.header).toHaveBeenCalledWith('Authorization');
      expect(mockNext).toHaveBeenCalled();
    });

    test('sollte Token aus get() Funktion extrahieren', async () => {
      // Coverage für req.get() Aufruf als Fallback
      const testToken = 'fallback.token';
      const decodedToken = { kundenId: 'kunde_789' };
      const testUser = { kunden_id: 'kunde_789', ist_aktiv: true };

      mockReq.get.mockReturnValue(`Bearer ${testToken}`);
      jwt.verify.mockReturnValue(decodedToken);
      database.query.mockResolvedValue({ rows: [testUser] });

      // Act
      await authentifizierung(mockReq, mockRes, mockNext);

      // Assert
      expect(mockReq.get).toHaveBeenCalledWith('Authorization');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Error Path Coverage', () => {
    test('sollte alle Token-fehlenden Pfade abdecken', async () => {
      // Kein Authorization Header
      await authentifizierung(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);

      jest.clearAllMocks();

      // Leerer Authorization Header
      mockReq.headers.authorization = '';
      await authentifizierung(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);

      jest.clearAllMocks();

      // Authorization Header ohne Bearer
      mockReq.headers.authorization = 'Invalid token';
      await authentifizierung(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);

      jest.clearAllMocks();

      // Authorization Header mit Bearer aber ohne Token
      mockReq.headers.authorization = 'Bearer ';
      await authentifizierung(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test('sollte alle JWT-Verifikations-Fehler abdecken', async () => {
      mockReq.headers.authorization = 'Bearer invalid.token';

      // Ungültiger Token
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      await authentifizierung(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);

      jest.clearAllMocks();

      // Abgelaufener Token
      jwt.verify.mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });
      await authentifizierung(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);

      jest.clearAllMocks();

      // Malformed Token
      jwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Malformed token');
      });
      await authentifizierung(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test('sollte alle Database-Error-Pfade abdecken', async () => {
      const testToken = 'valid.token';
      const decodedToken = { kundenId: 'test_kunde' };

      mockReq.headers.authorization = `Bearer ${testToken}`;
      jwt.verify.mockReturnValue(decodedToken);

      // Database Connection Error
      database.query.mockRejectedValue(new Error('Connection failed'));
      await authentifizierung(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(500);

      jest.clearAllMocks();

      // Database Timeout Error
      database.query.mockRejectedValue(new Error('Query timeout'));
      await authentifizierung(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(500);

      jest.clearAllMocks();

      // Database Constraint Error
      database.query.mockRejectedValue(new Error('Constraint violation'));
      await authentifizierung(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });

    test('sollte alle User-Status-Pfade abdecken', async () => {
      const testToken = 'valid.token';
      const decodedToken = { kundenId: 'test_kunde' };

      mockReq.headers.authorization = `Bearer ${testToken}`;
      jwt.verify.mockReturnValue(decodedToken);

      // User nicht gefunden
      database.query.mockResolvedValue({ rows: [] });
      await authentifizierung(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);

      jest.clearAllMocks();

      // User deaktiviert
      const deaktivierterUser = {
        kunden_id: 'test_kunde',
        email: 'test@example.com',
        ist_aktiv: false
      };
      database.query.mockResolvedValue({ rows: [deaktivierterUser] });
      await authentifizierung(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);

      jest.clearAllMocks();

      // User gesperrt
      const gesperrterUser = {
        kunden_id: 'test_kunde',
        email: 'test@example.com',
        ist_aktiv: true,
        ist_gesperrt: true
      };
      database.query.mockResolvedValue({ rows: [gesperrterUser] });
      await authentifizierung(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);

      jest.clearAllMocks();

      // User email nicht verifiziert
      const unverifizierterUser = {
        kunden_id: 'test_kunde',
        email: 'test@example.com',
        ist_aktiv: true,
        ist_gesperrt: false,
        ist_verifiziert: false
      };
      database.query.mockResolvedValue({ rows: [unverifizierterUser] });
      await authentifizierung(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Success Path Coverage', () => {
    test('sollte alle erfolgreichen User-Szenarien abdecken', async () => {
      const testToken = 'perfect.token';
      const decodedToken = { kundenId: 'perfect_kunde' };
      
      mockReq.headers.authorization = `Bearer ${testToken}`;
      jwt.verify.mockReturnValue(decodedToken);

      // Vollständig aktiver User
      const aktiverUser = {
        kunden_id: 'perfect_kunde',
        email: 'aktiv@example.com',
        ist_aktiv: true,
        ist_gesperrt: false,
        ist_verifiziert: true,
        vorname: 'Test',
        nachname: 'User',
        rolle: 'kunde'
      };
      database.query.mockResolvedValue({ rows: [aktiverUser] });

      // Act
      await authentifizierung(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.benutzer).toEqual(aktiverUser);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('sollte Admin-User korrekt verarbeiten', async () => {
      const adminToken = 'admin.token';
      const decodedToken = { kundenId: 'admin_user' };
      
      mockReq.headers.authorization = `Bearer ${adminToken}`;
      jwt.verify.mockReturnValue(decodedToken);

      const adminUser = {
        kunden_id: 'admin_user',
        email: 'admin@example.com',
        ist_aktiv: true,
        ist_gesperrt: false,
        ist_verifiziert: true,
        rolle: 'admin',
        berechtigungen: ['all']
      };
      database.query.mockResolvedValue({ rows: [adminUser] });

      // Act
      await authentifizierung(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.benutzer.rolle).toBe('admin');
    });
  });

  describe('Edge Cases Coverage', () => {
    test('sollte verschiedene JWT-Token-Formate verarbeiten', async () => {
      const edgeCases = [
        { token: 'sehr.langer.jwt.token.mit.vielen.segmenten', kundenId: 'edge1' },
        { token: 'kurz.jwt', kundenId: 'edge2' },
        { token: 'token.mit.sonderzeichen.äöü', kundenId: 'edge3' }
      ];

      for (const testCase of edgeCases) {
        jest.clearAllMocks();
        
        mockReq.headers.authorization = `Bearer ${testCase.token}`;
        jwt.verify.mockReturnValue({ kundenId: testCase.kundenId });
        
        const testUser = {
          kunden_id: testCase.kundenId,
          ist_aktiv: true,
          ist_gesperrt: false,
          ist_verifiziert: true
        };
        database.query.mockResolvedValue({ rows: [testUser] });

        await authentifizierung(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalled();
      }
    });

    test('sollte verschiedene Header-Casing verarbeiten', async () => {
      const headerVarianten = [
        'authorization',
        'Authorization',
        'AUTHORIZATION'
      ];

      for (const headerName of headerVarianten) {
        jest.clearAllMocks();
        
        mockReq.headers = {};
        mockReq.headers[headerName] = 'Bearer test.token';
        
        jwt.verify.mockReturnValue({ kundenId: 'test_user' });
        database.query.mockResolvedValue({ 
          rows: [{ 
            kunden_id: 'test_user', 
            ist_aktiv: true, 
            ist_gesperrt: false, 
            ist_verifiziert: true 
          }] 
        });

        await authentifizierung(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalled();
      }
    });

    test('sollte SQL-Injection-Versuche in Token-Daten abwehren', async () => {
      const maliciousToken = 'valid.token';
      const maliciousPayload = { 
        kundenId: "'; DROP TABLE kunden; --" 
      };
      
      mockReq.headers.authorization = `Bearer ${maliciousToken}`;
      jwt.verify.mockReturnValue(maliciousPayload);
      database.query.mockResolvedValue({ rows: [] }); // Kein User gefunden

      await authentifizierung(mockReq, mockRes, mockNext);
      
      // Sollte sicher handhaben - kein User gefunden = 401
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(database.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([maliciousPayload.kundenId])
      );
    });

    test('sollte Performance bei großen User-Objekten testen', async () => {
      const testToken = 'performance.token';
      const decodedToken = { kundenId: 'performance_user' };
      
      mockReq.headers.authorization = `Bearer ${testToken}`;
      jwt.verify.mockReturnValue(decodedToken);

      // User mit vielen Feldern
      const grosserUser = {
        kunden_id: 'performance_user',
        email: 'performance@example.com',
        ist_aktiv: true,
        ist_gesperrt: false,
        ist_verifiziert: true,
        vorname: 'Performance',
        nachname: 'User',
        telefon: '+49 123 456789',
        strasse: 'Performance Straße',
        hausnummer: '123',
        plz: '12345',
        stadt: 'Performance Stadt',
        bundesland: 'Performance Land',
        geburtsdatum: '1985-01-01',
        registriert_am: '2024-01-01T00:00:00Z',
        letzter_login: '2024-11-02T10:00:00Z',
        präferenzen: JSON.stringify({
          newsletter: true,
          marketing: false,
          sprache: 'de'
        }),
        verträge_anzahl: 5,
        jahresverbrauch: 4500,
        haushaltsgröße: 4
      };
      
      database.query.mockResolvedValue({ rows: [grosserUser] });

      const startTime = Date.now();
      await authentifizierung(mockReq, mockRes, mockNext);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Unter 100ms
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.benutzer).toEqual(grosserUser);
    });
  });

  describe('Error Message Coverage', () => {
    test('sollte alle deutschen Fehlermeldungen abdecken', async () => {
      // Kein Token
      await authentifizierung(mockReq, mockRes, mockNext);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          nachricht: 'Zugriff verweigert. Kein Token bereitgestellt.'
        })
      );

      jest.clearAllMocks();

      // Ungültiger Token
      mockReq.headers.authorization = 'Bearer invalid.token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      await authentifizierung(mockReq, mockRes, mockNext);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          nachricht: 'Ungültiger Token.'
        })
      );

      jest.clearAllMocks();

      // Server-Fehler
      jwt.verify.mockReturnValue({ kundenId: 'test' });
      database.query.mockRejectedValue(new Error('DB Error'));
      await authentifizierung(mockReq, mockRes, mockNext);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          nachricht: 'Serverfehler'
        })
      );
    });
  });
});