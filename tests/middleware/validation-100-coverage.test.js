const { validieren, schemas } = require('../../src/middleware/validation');

describe('🎯 100% Coverage Validation Tests', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = { body: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('Validation Middleware Core Function Coverage', () => {
    test('sollte alle Validierungsfelder für Kundenregistrierung abdecken', () => {
      // Test für 100% Path Coverage - Alle Felder valide
      const validierungsMiddleware = validieren(schemas.kundenRegistrierung);
      mockReq.body = {
        email: 'vollstaendig@test.de',
        passwort: 'KomplexPasswort123!',
        vorname: 'TestVorname',
        nachname: 'TestNachname',
        telefon: '+49 123 456789',
        geburtsdatum: '1990-01-01',
        strasse: 'Vollständige Straße',
        hausnummer: '42a',
        plz: '12345',
        stadt: 'Vollständige Stadt',
        bezirk: 'Test Bezirk',
        jahresverbrauch: 3500,
        haushaltgroesse: 3
      };

      validierungsMiddleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    test('sollte alle Validierungsbranches für Preisberechnung testen', () => {
      // Coverage für alle Preisberechnung-Pfade
      const validierungsMiddleware = validieren(schemas.preisBerechnung);
      mockReq.body = {
        plz: '10115',
        jahresverbrauch: 4000,
        haushaltgroesse: 4,
        tariftyp: 'fest',
        solaranlage: true,
        elektrofahrzeug: false,
        waermepumpe: true
      };

      validierungsMiddleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    test('sollte alle Error-Paths für ungültige Eingaben abdecken', () => {
      // Coverage für Error-Handling-Pfade
      const validierungsMiddleware = validieren(schemas.kundenRegistrierung);
      mockReq.body = {
        email: 'invalid-email',
        passwort: '123', // Zu schwach
        vorname: 'A', // Zu kurz
        nachname: '', // Leer
        telefon: 'ungültig',
        plz: '123', // Zu kurz
        stadt: 'B', // Zu kurz
        jahresverbrauch: 100, // Zu niedrig
        haushaltgroesse: 0 // Zu niedrig
      };

      validierungsMiddleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('sollte Language-Validation vollständig abdecken', () => {
      // Coverage für Sprach-Validierung
      const deutschValidierung = validieren(schemas.sprache);
      mockReq.body = { sprache: 'de' };
      deutschValidierung(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();

      jest.clearAllMocks();

      const englischValidierung = validieren(schemas.sprache);
      mockReq.body = { sprache: 'en' };
      englischValidierung(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();

      jest.clearAllMocks();

      const ungueltigeValidierung = validieren(schemas.sprache);
      mockReq.body = { sprache: 'xyz' };
      ungueltigeValidierung(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('sollte Update-Validierung vollständig abdecken', () => {
      // Coverage für alle Update-Pfade
      const updateValidierung = validieren(schemas.kundeAktualisieren);
      
      // Leeres Update
      mockReq.body = {};
      updateValidierung(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();

      jest.clearAllMocks();

      // Vollständiges Update
      mockReq.body = {
        vorname: 'NeuerVorname',
        nachname: 'NeuerNachname',
        telefon: '+49 987 654321',
        strasse: 'Neue Straße',
        hausnummer: '99',
        plz: '54321',
        stadt: 'Neue Stadt',
        bezirk: 'Neuer Bezirk'
      };
      updateValidierung(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    test('sollte alle Edge-Cases und Boundary-Values abdecken', () => {
      // Boundary Value Testing für 100% Coverage
      const validierungsMiddleware = validieren(schemas.preisBerechnung);
      
      // Minimale Werte
      mockReq.body = {
        plz: '01234',
        jahresverbrauch: 500, // Minimum
        haushaltgroesse: 1, // Minimum
        tariftyp: 'dynamisch'
      };
      validierungsMiddleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();

      jest.clearAllMocks();

      // Maximale Werte
      mockReq.body = {
        plz: '99999',
        jahresverbrauch: 50000, // Maximum
        haushaltgroesse: 20, // Maximum
        tariftyp: 'gruen'
      };
      validierungsMiddleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    test('sollte alle Boolean-Kombinationen abdecken', () => {
      // Coverage für alle Boolean-Pfade
      const validierungsMiddleware = validieren(schemas.preisBerechnung);
      
      const booleanKombinationen = [
        { solaranlage: true, elektrofahrzeug: true, waermepumpe: true },
        { solaranlage: true, elektrofahrzeug: true, waermepumpe: false },
        { solaranlage: true, elektrofahrzeug: false, waermepumpe: true },
        { solaranlage: true, elektrofahrzeug: false, waermepumpe: false },
        { solaranlage: false, elektrofahrzeug: true, waermepumpe: true },
        { solaranlage: false, elektrofahrzeug: true, waermepumpe: false },
        { solaranlage: false, elektrofahrzeug: false, waermepumpe: true },
        { solaranlage: false, elektrofahrzeug: false, waermepumpe: false }
      ];

      booleanKombinationen.forEach((kombination, index) => {
        jest.clearAllMocks();
        mockReq.body = {
          plz: '12345',
          jahresverbrauch: 3500,
          haushaltgroesse: 3,
          tariftyp: 'fest',
          ...kombination
        };
        
        validierungsMiddleware(mockReq, mockRes, mockNext);
        expect(mockNext).toHaveBeenCalled();
      });
    });

    test('sollte alle String-Length-Validierungen abdecken', () => {
      // Coverage für alle String-Längen-Validierungen
      const validierungsMiddleware = validieren(schemas.kundenRegistrierung);
      
      // Längste erlaubte Strings
      mockReq.body = {
        email: 'a'.repeat(60) + '@test.de',
        passwort: 'A1b!' + 'a'.repeat(50),
        vorname: 'A'.repeat(50), // Maximum 50
        nachname: 'B'.repeat(50), // Maximum 50
        telefon: '+49 123 456 789 012 345', // Maximum 15 Digits
        strasse: 'S'.repeat(255), // Maximum 255
        hausnummer: 'H'.repeat(10), // Maximum 10
        plz: '12345',
        stadt: 'C'.repeat(100), // Maximum 100
        bezirk: 'D'.repeat(100), // Maximum 100
        jahresverbrauch: 25000,
        haushaltgroesse: 10
      };

      validierungsMiddleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    test('sollte alle Date-Validierungen abdecken', () => {
      // Coverage für Datums-Validierungen
      const validierungsMiddleware = validieren(schemas.kundenRegistrierung);
      
      // Gültiges Geburtsdatum
      mockReq.body = {
        email: 'geburtsdatum@test.de',
        passwort: 'TestPasswort123!',
        vorname: 'Test',
        nachname: 'User',
        strasse: 'Teststraße',
        hausnummer: '1',
        plz: '12345',
        stadt: 'Teststadt',
        geburtsdatum: '1985-06-15'
      };

      validierungsMiddleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();

      jest.clearAllMocks();

      // Ungültiges Geburtsdatum (Zukunft)
      mockReq.body.geburtsdatum = '2030-01-01';
      validierungsMiddleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    test('sollte alle optionalen Felder-Kombinationen abdecken', () => {
      // Coverage für optionale Felder
      const validierungsMiddleware = validieren(schemas.kundenRegistrierung);
      
      // Nur Pflichtfelder
      mockReq.body = {
        email: 'nur.pflicht@test.de',
        passwort: 'Pflicht123!',
        vorname: 'Pflicht',
        nachname: 'User',
        strasse: 'Pflichtstraße',
        hausnummer: '1',
        plz: '12345',
        stadt: 'Pflichtstadt'
      };

      validierungsMiddleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();

      jest.clearAllMocks();

      // Mit einigen optionalen Feldern
      mockReq.body.telefon = '+49 123 456789';
      mockReq.body.jahresverbrauch = 4000;
      validierungsMiddleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Schema Coverage Tests', () => {
    test('sollte alle definierten Schemas verwenden', () => {
      // Teste alle Schemas für vollständige Coverage
      const alleSchemas = [
        'kundenRegistrierung',
        'preisBerechnung', 
        'kundeAktualisieren',
        'sprache'
      ];

      alleSchemas.forEach(schemaName => {
        expect(schemas[schemaName]).toBeDefined();
        const validierungsMiddleware = validieren(schemas[schemaName]);
        expect(typeof validierungsMiddleware).toBe('function');
      });
    });
  });
});