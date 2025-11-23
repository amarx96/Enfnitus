const request = require('supertest');
const express = require('express');
const customerRoutes = require('../../src/routes/customer');
const { authentifizierung } = require('../../src/middleware/auth');
const database = require('../../src/config/database');
const TestUtils = require('../utils/testUtils');

// Mock der Abhängigkeiten
jest.mock('../../src/config/database');
jest.mock('../../src/utils/logger');
jest.mock('../../src/middleware/auth');

// Test-App erstellen
const app = express();
app.use(express.json());
app.use('/api/v1/kunden', customerRoutes);

describe('👤 Customer Management Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Standard-Auth-Mock
    authentifizierung.mockImplementation((req, res, next) => {
      req.benutzer = TestUtils.erstelleTestKunde();
      next();
    });
  });

  describe('GET /api/v1/kunden/profil', () => {
    test('sollte vollständiges Kundenprofil zurückgeben', async () => {
      // Arrange
      const testKunde = TestUtils.erstelleTestKunde();
      const testMetadaten = {
        jahresverbrauch_kwh: 3500,
        haushaltgroesse: 3,
        zaehler_nummer: '12345678',
        heizungstyp: 'gas',
        hat_elektrofahrzeug: false,
        hat_solaranlage: false,
        hat_waermepumpe: false
      };

      database.query
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([testKunde])) // Kunden-Grunddaten
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([testMetadaten])); // Metadaten

      // Act
      const response = await request(app)
        .get('/api/v1/kunden/profil')
        .expect(200);

      // Assert
      TestUtils.validiereApiResponse(response.body, true);
      const profil = response.body.daten;
      
      expect(profil).toHaveProperty('kundenId', testKunde.kunden_id);
      expect(profil).toHaveProperty('email', testKunde.email);
      expect(profil).toHaveProperty('vorname', testKunde.vorname);
      expect(profil).toHaveProperty('nachname', testKunde.nachname);
      expect(profil).toHaveProperty('adresse');
      expect(profil).toHaveProperty('praeferenzen');
      expect(profil).toHaveProperty('energieprofil');
      expect(profil).toHaveProperty('konto');

      expect(profil.adresse.plz).toBe(testKunde.plz);
      expect(profil.energieprofil.jahresverbrauch).toBe(testMetadaten.jahresverbrauch_kwh);
    });

    test('sollte Fehler bei nicht gefundenem Kunden zurückgeben', async () => {
      // Arrange
      database.query.mockResolvedValueOnce(TestUtils.mockDbAntwort([])); // Kein Kunde gefunden

      // Act
      const response = await request(app)
        .get('/api/v1/kunden/profil')
        .expect(404);

      // Assert
      TestUtils.validiereApiResponse(response.body, false);
      expect(response.body.nachricht).toContain('Kunde nicht gefunden');
    });

    test('sollte auch ohne Metadaten funktionieren', async () => {
      // Arrange
      const testKunde = TestUtils.erstelleTestKunde();
      
      database.query
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([testKunde])) // Kunden-Grunddaten
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([])); // Keine Metadaten

      // Act
      const response = await request(app)
        .get('/api/v1/kunden/profil')
        .expect(200);

      // Assert
      TestUtils.validiereApiResponse(response.body, true);
      const profil = response.body.daten;
      expect(profil.energieprofil.jahresverbrauch).toBeUndefined();
    });
  });

  describe('PUT /api/v1/kunden/profil', () => {
    test('sollte Kundenprofil erfolgreich aktualisieren', async () => {
      // Arrange
      const testKunde = TestUtils.erstelleTestKunde();
      const update = {
        vorname: 'Maximilian',
        telefon: '+49 30 87654321',
        stadt: 'Hamburg',
        bevorzugteSprache: 'vi'
      };

      database.query
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([testKunde])) // PLZ-Validierung
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([testKunde])) // Update
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([{ // Aktualisierte Daten
          ...testKunde,
          ...update
        }]));

      // Act
      const response = await request(app)
        .put('/api/v1/kunden/profil')
        .send(update)
        .expect(200);

      // Assert
      TestUtils.validiereApiResponse(response.body, true);
      expect(response.body.nachricht).toContain('erfolgreich aktualisiert');
      expect(response.body.daten.vorname).toBe(update.vorname);
      expect(response.body.daten.telefon).toBe(update.telefon);
    });

    test('sollte PLZ-Validierung durchführen', async () => {
      // Arrange
      const update = {
        plz: '99999' // Nicht existierende PLZ
      };

      database.query.mockResolvedValueOnce(TestUtils.mockDbAntwort([])); // PLZ nicht gefunden

      // Act
      const response = await request(app)
        .put('/api/v1/kunden/profil')
        .send(update)
        .expect(400);

      // Assert
      TestUtils.validiereApiResponse(response.body, false);
      expect(response.body.nachricht).toContain('Postleitzahl wird derzeit nicht von uns beliefert');
    });

    test('sollte leere Updates ablehnen', async () => {
      // Act
      const response = await request(app)
        .put('/api/v1/kunden/profil')
        .send({})
        .expect(400);

      // Assert
      TestUtils.validiereApiResponse(response.body, false);
      expect(response.body.nachricht).toContain('Keine Felder zu aktualisieren');
    });

    test('sollte nur erlaubte Felder aktualisieren', async () => {
      // Arrange
      const update = {
        vorname: 'Max',
        email: 'neue@email.com', // Sollte ignoriert werden
        kunden_id: 'neue_id',    // Sollte ignoriert werden
        ist_aktiv: false         // Sollte ignoriert werden
      };

      database.query
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([TestUtils.erstelleTestKunde()])); // Update

      // Act
      const response = await request(app)
        .put('/api/v1/kunden/profil')
        .send(update)
        .expect(200);

      // Assert
      // Prüfe, dass nur erlaubte Felder in der SQL-Abfrage verwendet wurden
      const updateQuery = database.query.mock.calls[0][0];
      expect(updateQuery).toContain('vorname');
      expect(updateQuery).not.toContain('email');
      expect(updateQuery).not.toContain('kunden_id');
      expect(updateQuery).not.toContain('ist_aktiv');
    });
  });

  describe('PUT /api/v1/kunden/energie-profil', () => {
    test('sollte neues Energieprofil erstellen', async () => {
      // Arrange
      const energieUpdate = {
        jahresverbrauch: 4200,
        haushaltgroesse: 4,
        zaehlerNummer: '87654321',
        heizungstyp: 'waermepumpe',
        hatElektrofahrzeug: true,
        hatSolaranlage: false,
        hatWaermepumpe: true
      };

      database.query
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([])) // Keine existierenden Metadaten
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([{}])); // Insert erfolgreich

      // Act
      const response = await request(app)
        .put('/api/v1/kunden/energie-profil')
        .send(energieUpdate)
        .expect(200);

      // Assert
      TestUtils.validiereApiResponse(response.body, true);
      expect(response.body.nachricht).toContain('Energieprofil wurde erfolgreich aktualisiert');
    });

    test('sollte existierendes Energieprofil aktualisieren', async () => {
      // Arrange
      const energieUpdate = {
        jahresverbrauch: 3800,
        haushaltgroesse: 3
      };

      database.query
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([{ kunden_id: 'test' }])) // Existierende Metadaten
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([{}])); // Update erfolgreich

      // Act
      const response = await request(app)
        .put('/api/v1/kunden/energie-profil')
        .send(energieUpdate)
        .expect(200);

      // Assert
      TestUtils.validiereApiResponse(response.body, true);
      
      // Prüfe, dass UPDATE statt INSERT verwendet wurde
      const updateQuery = database.query.mock.calls[1][0];
      expect(updateQuery).toContain('UPDATE kunden_metadaten');
    });

    test('sollte Validierung für Energiedaten durchführen', async () => {
      // Arrange
      const ungueltigeUpdates = [
        { jahresverbrauch: -100 },    // Negativ
        { jahresverbrauch: 100000 },  // Zu hoch
        { haushaltgroesse: 0 },       // Zu niedrig
        { haushaltgroesse: 50 }       // Zu hoch
      ];

      // Act & Assert
      for (const update of ungueltigeUpdates) {
        const response = await request(app)
          .put('/api/v1/kunden/energie-profil')
          .send(update)
          .expect(400);

        TestUtils.validiereApiResponse(response.body, false);
      }
    });
  });

  describe('GET /api/v1/kunden/verbrauchshistorie', () => {
    test('sollte Verbrauchshistorie zurückgeben', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/kunden/verbrauchshistorie')
        .expect(200);

      // Assert
      TestUtils.validiereApiResponse(response.body, true);
      const daten = response.body.daten;
      
      expect(daten).toHaveProperty('zusammenfassung');
      expect(daten).toHaveProperty('historie');
      expect(daten.zusammenfassung).toHaveProperty('gesamtverbrauch');
      expect(daten.zusammenfassung).toHaveProperty('durchschnittMonatlich');
      expect(Array.isArray(daten.historie)).toBe(true);

      // Prüfe Historien-Format
      if (daten.historie.length > 0) {
        const eintrag = daten.historie[0];
        expect(eintrag).toHaveProperty('zeitraum');
        expect(eintrag).toHaveProperty('verbrauch');
        expect(eintrag).toHaveProperty('kosten');
        expect(eintrag).toHaveProperty('einheit');
      }
    });

    test('sollte Filterung nach Jahr unterstützen', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/kunden/verbrauchshistorie?jahr=2024')
        .expect(200);

      // Assert
      TestUtils.validiereApiResponse(response.body, true);
      expect(response.body.daten.zusammenfassung.zeitraum).toBe('2024');
    });

    test('sollte Limit-Parameter respektieren', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/kunden/verbrauchshistorie?limit=6')
        .expect(200);

      // Assert
      TestUtils.validiereApiResponse(response.body, true);
      expect(response.body.daten.historie.length).toBeLessThanOrEqual(6);
    });
  });

  describe('DELETE /api/v1/kunden/konto-loeschen', () => {
    test('sollte Konto erfolgreich deaktivieren', async () => {
      // Arrange
      const loeschgrund = {
        grund: 'Umzug ins Ausland',
        feedback: 'Service war gut, aber ziehe um'
      };

      database.query
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([])) // Keine aktiven Verträge
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([{}])); // Deaktivierung erfolgreich

      // Act
      const response = await request(app)
        .delete('/api/v1/kunden/konto-loeschen')
        .send(loeschgrund)
        .expect(200);

      // Assert
      TestUtils.validiereApiResponse(response.body, true);
      expect(response.body.nachricht).toContain('erfolgreich deaktiviert');
    });

    test('sollte Löschung bei aktiven Verträgen verhindern', async () => {
      // Arrange
      const aktiverVertrag = { vertrag_id: 'vertrag_123' };
      database.query.mockResolvedValueOnce(TestUtils.mockDbAntwort([aktiverVertrag])); // Aktive Verträge gefunden

      const loeschgrund = {
        grund: 'Nicht zufrieden'
      };

      // Act
      const response = await request(app)
        .delete('/api/v1/kunden/konto-loeschen')
        .send(loeschgrund)
        .expect(400);

      // Assert
      TestUtils.validiereApiResponse(response.body, false);
      expect(response.body.nachricht).toContain('aktive Verträge');
    });

    test('sollte Grund für Löschung verlangen', async () => {
      // Act
      const response = await request(app)
        .delete('/api/v1/kunden/konto-loeschen')
        .send({})
        .expect(400);

      // Assert
      TestUtils.validiereApiResponse(response.body, false);
      expect(response.body.nachricht).toContain('Grund für Account-Löschung ist erforderlich');
    });
  });

  describe('Authentifizierung und Sicherheit', () => {
    test('sollte nicht authentifizierte Anfragen ablehnen', async () => {
      // Arrange
      authentifizierung.mockImplementation((req, res, next) => {
        res.status(401).json({
          erfolg: false,
          nachricht: 'Nicht berechtigt'
        });
      });

      // Act
      const response = await request(app)
        .get('/api/v1/kunden/profil')
        .expect(401);

      // Assert
      TestUtils.validiereApiResponse(response.body, false);
    });

    test('sollte nur eigene Daten zugänglich machen', async () => {
      // Arrange
      const testKunde = TestUtils.erstelleTestKunde({ kunden_id: 'kunde_123' });
      
      authentifizierung.mockImplementation((req, res, next) => {
        req.benutzer = testKunde;
        next();
      });

      database.query.mockResolvedValueOnce(TestUtils.mockDbAntwort([testKunde]));

      // Act
      const response = await request(app)
        .get('/api/v1/kunden/profil')
        .expect(200);

      // Assert
      // Prüfe, dass nur Daten des authentifizierten Benutzers abgerufen wurden
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE kunden_id = $1'),
        [testKunde.kunden_id]
      );
    });

    test('sollte sensible Daten nicht in API-Antworten preisgeben', async () => {
      // Arrange
      const testKunde = TestUtils.erstelleTestKunde();
      database.query
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([testKunde]))
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([]));

      // Act
      const response = await request(app)
        .get('/api/v1/kunden/profil')
        .expect(200);

      // Assert
      const profil = response.body.daten;
      expect(profil).not.toHaveProperty('passwort_hash');
      expect(profil).not.toHaveProperty('verifizierungs_token');
      expect(profil).not.toHaveProperty('passwort_reset_token');
    });
  });

  describe('Performance und Edge Cases', () => {
    test('sollte große Profilupdates effizient verarbeiten', async () => {
      // Arrange
      const grossesUpdate = {
        vorname: 'MaximilianVeryLongFirstName',
        nachname: 'MustermannVeryLongLastName',
        strasse: 'Sehr lange Straßenname mit vielen Wörtern',
        telefon: '+49 30 12345678901234567890',
        bevorzugteSprache: 'de'
      };

      database.query
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([TestUtils.erstelleTestKunde()]));

      // Act
      const startZeit = Date.now();
      const response = await request(app)
        .put('/api/v1/kunden/profil')
        .send(grossesUpdate)
        .expect(200);
      const endZeit = Date.now();

      // Assert
      expect(endZeit - startZeit).toBeLessThan(500); // Unter 500ms
      TestUtils.validiereApiResponse(response.body, true);
    });

    test('sollte Datenbankfehler ordnungsgemäß behandeln', async () => {
      // Arrange
      database.query.mockRejectedValueOnce(new Error('Datenbankfehler'));

      // Act
      const response = await request(app)
        .get('/api/v1/kunden/profil')
        .expect(500);

      // Assert
      TestUtils.validiereApiResponse(response.body, false);
      expect(response.body.nachricht).toContain('Serverfehler');
    });

    test('sollte Unicode-Zeichen in Namen korrekt handhaben', async () => {
      // Arrange
      const unicodeUpdate = {
        vorname: 'Nguyễn',
        nachname: 'Thị Minh',
        stadt: 'Düsseldorf'
      };

      database.query
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([TestUtils.erstelleTestKunde()]));

      // Act
      const response = await request(app)
        .put('/api/v1/kunden/profil')
        .send(unicodeUpdate)
        .expect(200);

      // Assert
      TestUtils.validiereApiResponse(response.body, true);
    });
  });
});