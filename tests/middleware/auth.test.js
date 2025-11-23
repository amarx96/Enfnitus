const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authentifizierung } = require('../../src/middleware/auth');
const database = require('../../src/config/database');
const TestUtils = require('../utils/testUtils');

// Mock der Datenbank
jest.mock('../../src/config/database');
jest.mock('../../src/utils/logger');

describe('🔐 Authentifizierungs-Middleware Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {},
      benutzer: null
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('Token-Validierung', () => {
    test('sollte erfolgreiche Authentifizierung mit gültigem Token durchführen', async () => {
      // Arrange
      const testKunde = TestUtils.erstelleTestKunde();
      const token = TestUtils.erstelleJwtToken({ 
        id: testKunde.kunden_id,
        kunden_id: testKunde.kunden_id 
      });
      
      mockReq.headers.authorization = `Bearer ${token}`;
      database.query.mockResolvedValue(
        TestUtils.mockDbAntwort([{
          kunden_id: testKunde.kunden_id,
          email: testKunde.email,
          ist_aktiv: true
        }])
      );

      // Act
      await authentifizierung(mockReq, mockRes, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.benutzer).toBeDefined();
      expect(mockReq.benutzer.kunden_id).toBe(testKunde.kunden_id);
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('sollte Fehler bei fehlendem Token zurückgeben', async () => {
      // Act
      await authentifizierung(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        erfolg: false,
        nachricht: 'Nicht berechtigt, auf diese Route zuzugreifen'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('sollte Fehler bei ungültigem Token zurückgeben', async () => {
      // Arrange
      mockReq.headers.authorization = 'Bearer ungültiger_token';

      // Act
      await authentifizierung(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        erfolg: false,
        nachricht: 'Nicht berechtigt, auf diese Route zuzugreifen'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('sollte Fehler bei abgelaufenem Token zurückgeben', async () => {
      // Arrange
      const abgelaufenerToken = jwt.sign(
        { id: 'test_id' }, 
        process.env.JWT_SECRET, 
        { expiresIn: '-1h' }
      );
      mockReq.headers.authorization = `Bearer ${abgelaufenerToken}`;

      // Act
      await authentifizierung(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        erfolg: false,
        nachricht: 'Nicht berechtigt, auf diese Route zuzugreifen'
      });
    });

    test('sollte Fehler bei nicht existierendem Benutzer zurückgeben', async () => {
      // Arrange
      const token = TestUtils.erstelleJwtToken();
      mockReq.headers.authorization = `Bearer ${token}`;
      database.query.mockResolvedValue(TestUtils.mockDbAntwort([]));

      // Act
      await authentifizierung(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        erfolg: false,
        nachricht: 'Token ist nicht mehr gültig'
      });
    });

    test('sollte Fehler bei deaktiviertem Benutzer zurückgeben', async () => {
      // Arrange
      const testKunde = TestUtils.erstelleTestKunde({ ist_aktiv: false });
      const token = TestUtils.erstelleJwtToken({ 
        id: testKunde.kunden_id,
        kunden_id: testKunde.kunden_id 
      });
      
      mockReq.headers.authorization = `Bearer ${token}`;
      database.query.mockResolvedValue(
        TestUtils.mockDbAntwort([{
          kunden_id: testKunde.kunden_id,
          email: testKunde.email,
          ist_aktiv: false
        }])
      );

      // Act
      await authentifizierung(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        erfolg: false,
        nachricht: 'Benutzerkonto ist deaktiviert'
      });
    });
  });

  describe('Token-Format-Validierung', () => {
    test('sollte Token aus Authorization-Header extrahieren', async () => {
      // Arrange
      const testKunde = TestUtils.erstelleTestKunde();
      const token = TestUtils.erstelleJwtToken({ 
        id: testKunde.kunden_id,
        kunden_id: testKunde.kunden_id 
      });
      
      mockReq.headers.authorization = `Bearer ${token}`;
      database.query.mockResolvedValue(
        TestUtils.mockDbAntwort([testKunde])
      );

      // Act
      await authentifizierung(mockReq, mockRes, mockNext);

      // Assert
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('SELECT kunden_id'),
        expect.arrayContaining([testKunde.kunden_id])
      );
    });

    test('sollte verschiedene Authorization-Header-Formate ablehnen', async () => {
      const ungueltigeHeader = [
        'Basic dGVzdDp0ZXN0',
        'Bearer',
        'bearer token',
        'Token abc123',
        ''
      ];

      for (const header of ungueltigeHeader) {
        mockReq.headers.authorization = header;
        await authentifizierung(mockReq, mockRes, mockNext);
        
        expect(mockRes.status).toHaveBeenCalledWith(401);
        jest.clearAllMocks();
      }
    });
  });

  describe('Datenbankfehler-Behandlung', () => {
    test('sollte Datenbankfehler ordnungsgemäß behandeln', async () => {
      // Arrange
      const token = TestUtils.erstelleJwtToken();
      mockReq.headers.authorization = `Bearer ${token}`;
      database.query.mockRejectedValue(new Error('Datenbankverbindung fehlgeschlagen'));

      // Act
      await authentifizierung(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        erfolg: false,
        nachricht: 'Serverfehler'
      });
    });

    test('sollte SQL-Injection-Versuche abwehren', async () => {
      // Arrange
      const maliciousPayload = {
        id: "'; DROP TABLE kunden; --",
        kunden_id: "abc123"
      };
      
      const token = jwt.sign(maliciousPayload, process.env.JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;
      database.query.mockResolvedValue(TestUtils.mockDbAntwort([]));

      // Act
      await authentifizierung(mockReq, mockRes, mockNext);

      // Assert
      expect(database.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([maliciousPayload.id])
      );
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Performance Tests', () => {
    test('sollte Authentifizierung innerhalb von 100ms abschließen', async () => {
      // Arrange
      const testKunde = TestUtils.erstelleTestKunde();
      const token = TestUtils.erstelleJwtToken({ 
        id: testKunde.kunden_id,
        kunden_id: testKunde.kunden_id 
      });
      
      mockReq.headers.authorization = `Bearer ${token}`;
      database.query.mockResolvedValue(
        TestUtils.mockDbAntwort([testKunde])
      );

      // Act
      const startZeit = Date.now();
      await authentifizierung(mockReq, mockRes, mockNext);
      const endZeit = Date.now();

      // Assert
      expect(endZeit - startZeit).toBeLessThan(100);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Sicherheitstests', () => {
    test('sollte sensible Daten nicht in Fehlermeldungen preisgeben', async () => {
      // Arrange
      const token = jwt.sign(
        { kunden_id: 'geheimer_benutzer', password: 'geheimes_passwort' },
        'falscher_secret'
      );
      mockReq.headers.authorization = `Bearer ${token}`;

      // Act
      await authentifizierung(mockReq, mockRes, mockNext);

      // Assert
      expect(mockRes.json).toHaveBeenCalledWith({
        erfolg: false,
        nachricht: 'Nicht berechtigt, auf diese Route zuzugreifen'
      });
      
      const antwort = mockRes.json.mock.calls[0][0];
      expect(antwort.nachricht).not.toContain('geheimer_benutzer');
      expect(antwort.nachricht).not.toContain('geheimes_passwort');
    });

    test('sollte gegen Timing-Angriffe resistent sein', async () => {
      const zeiten = [];
      
      // Teste verschiedene ungültige Token-Szenarien
      const szenarien = [
        'Bearer ungültiger_token',
        'Bearer ' + 'a'.repeat(200),
        'Bearer valid.jwt.format.but.wrong.signature',
        ''
      ];

      for (const szenario of szenarien) {
        mockReq.headers.authorization = szenario;
        
        const start = process.hrtime.bigint();
        await authentifizierung(mockReq, mockRes, mockNext);
        const end = process.hrtime.bigint();
        
        zeiten.push(Number(end - start) / 1000000); // Convert to milliseconds
        jest.clearAllMocks();
      }

      // Die Zeiten sollten ähnlich sein (weniger als 50ms Unterschied)
      const minZeit = Math.min(...zeiten);
      const maxZeit = Math.max(...zeiten);
      expect(maxZeit - minZeit).toBeLessThan(50);
    });
  });
});