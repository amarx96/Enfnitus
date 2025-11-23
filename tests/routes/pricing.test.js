const request = require('supertest');
const express = require('express');
const pricingRoutes = require('../../src/routes/pricing');
const database = require('../../src/config/database');
const TestUtils = require('../utils/testUtils');

// Mock der Abhängigkeiten
jest.mock('../../src/config/database');
jest.mock('../../src/utils/logger');

// Test-App erstellen
const app = express();
app.use(express.json());
app.use('/api/v1/preise', pricingRoutes);

describe('💰 Pricing Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/preise/berechnen', () => {
    test('sollte erfolgreiche Preisberechnung für gültige PLZ durchführen', async () => {
      // Arrange
      const testPlz = TestUtils.erstelleTestPlz();
      const testTarif = TestUtils.erstelleTestTarif();
      const testPreise = TestUtils.erstelleTestPreise();

      database.query
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([testPlz])) // PLZ-Lookup
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([{ // Pricing Query
          tarif_id: testTarif.id,
          tarif_name: testTarif.tarif_name,
          tarif_typ: testTarif.tarif_typ,
          arbeitspreis_cent_pro_kwh: testPreise.arbeitspreis_cent_pro_kwh,
          grundpreis_euro_pro_monat: testPreise.grundpreis_euro_pro_monat,
          netzentgelte_cent_pro_kwh: testPreise.netzentgelte_cent_pro_kwh,
          steuern_cent_pro_kwh: testPreise.steuern_cent_pro_kwh
        }]));

      const anfrage = {
        plz: testPlz.plz,
        jahresverbrauch: 3500,
        haushaltgroesse: 3
      };

      // Act
      const response = await request(app)
        .post('/api/v1/preise/berechnen')
        .send(anfrage)
        .expect(200);

      // Assert
      TestUtils.validiereApiResponse(response.body, true);
      expect(response.body.daten).toHaveProperty('standort');
      expect(response.body.daten).toHaveProperty('verbrauchsdaten');
      expect(response.body.daten).toHaveProperty('tarife');
      expect(response.body.daten.standort.plz).toBe(testPlz.plz);
      expect(response.body.daten.verbrauchsdaten.geschaetzterVerbrauch).toBe(3500);
    });

    test('sollte Verbrauch basierend auf Haushaltsgröße schätzen', async () => {
      // Arrange
      const testPlz = TestUtils.erstelleTestPlz();
      database.query
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([testPlz]))
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([]));

      const anfrage = {
        plz: testPlz.plz,
        haushaltgroesse: 4 // Kein Jahresverbrauch angegeben
      };

      // Act
      const response = await request(app)
        .post('/api/v1/preise/berechnen')
        .send(anfrage)
        .expect(200);

      // Assert
      const geschaetzterVerbrauch = response.body.daten.verbrauchsdaten.geschaetzterVerbrauch;
      expect(geschaetzterVerbrauch).toBe(4200); // 1000 + (4 * 800)
    });

    test('sollte Standard-Verbrauch verwenden wenn keine Daten angegeben', async () => {
      // Arrange
      const testPlz = TestUtils.erstelleTestPlz();
      database.query
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([testPlz]))
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([]));

      const anfrage = {
        plz: testPlz.plz
        // Kein Verbrauch oder Haushaltsgröße
      };

      // Act
      const response = await request(app)
        .post('/api/v1/preise/berechnen')
        .send(anfrage)
        .expect(200);

      // Assert
      const geschaetzterVerbrauch = response.body.daten.verbrauchsdaten.geschaetzterVerbrauch;
      expect(geschaetzterVerbrauch).toBe(3500); // Standard-Verbrauch
    });

    test('sollte Fehler für nicht verfügbare PLZ zurückgeben', async () => {
      // Arrange
      database.query.mockResolvedValueOnce(TestUtils.mockDbAntwort([])); // Keine PLZ gefunden

      const anfrage = {
        plz: '99999' // Nicht existierende PLZ
      };

      // Act
      const response = await request(app)
        .post('/api/v1/preise/berechnen')
        .send(anfrage)
        .expect(404);

      // Assert
      TestUtils.validiereApiResponse(response.body, false);
      expect(response.body.nachricht).toContain('Keine Daten für diese PLZ verfügbar');
    });

    test('sollte verschiedene Tariftypen korrekt filtern', async () => {
      // Arrange
      const testPlz = TestUtils.erstelleTestPlz();
      const tarife = [
        { ...TestUtils.erstelleTestTarif(), tarif_typ: 'fest', id: 1 },
        { ...TestUtils.erstelleTestTarif(), tarif_typ: 'dynamisch', id: 2 },
        { ...TestUtils.erstelleTestTarif(), tarif_typ: 'gruen', id: 3 }
      ];

      database.query
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([testPlz]))
        .mockResolvedValueOnce(TestUtils.mockDbAntwort(tarife));

      const anfrage = {
        plz: testPlz.plz,
        tariftyp: 'gruen'
      };

      // Act
      const response = await request(app)
        .post('/api/v1/preise/berechnen')
        .send(anfrage)
        .expect(200);

      // Assert
      expect(database.query).toHaveBeenCalledWith(
        expect.stringContaining("tarif_typ = 'gruen'"),
        expect.any(Array)
      );
    });

    test('sollte Preisberechnung mit Steuern und Umlagen durchführen', async () => {
      // Arrange
      const testPlz = TestUtils.erstelleTestPlz();
      const testTarif = TestUtils.erstelleTestTarif();
      const tarifDaten = {
        tarif_id: testTarif.id,
        tarif_name: testTarif.tarif_name,
        arbeitspreis_cent_pro_kwh: 25.00,
        grundpreis_euro_pro_monat: 10.00,
        netzentgelte_cent_pro_kwh: 7.00,
        steuern_cent_pro_kwh: 5.00,
        erneuerbare_umlage_cent_pro_kwh: 3.72
      };

      database.query
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([testPlz]))
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([tarifDaten]));

      const anfrage = {
        plz: testPlz.plz,
        jahresverbrauch: 3000
      };

      // Act
      const response = await request(app)
        .post('/api/v1/preise/berechnen')
        .send(anfrage)
        .expect(200);

      // Assert
      const tarif = response.body.daten.tarife[0];
      expect(tarif).toHaveProperty('preisdetails');
      expect(tarif.preisdetails).toHaveProperty('arbeitspreis');
      expect(tarif.preisdetails).toHaveProperty('grundpreis');
      expect(tarif.preisdetails).toHaveProperty('netzentgelte');
      expect(tarif.preisdetails).toHaveProperty('steuern');
      
      // Berechne erwarteten Gesamtpreis
      const jahreskosten = tarif.jahreskosten;
      expect(jahreskosten).toBeGreaterThan(0);
    });
  });

  describe('GET /api/v1/preise/tarife', () => {
    test('sollte alle aktiven Tarife zurückgeben', async () => {
      // Arrange
      const aktiveTarife = [
        TestUtils.erstelleTestTarif({ ist_aktiv: true, id: 1 }),
        TestUtils.erstelleTestTarif({ ist_aktiv: true, id: 2 }),
        TestUtils.erstelleTestTarif({ ist_aktiv: false, id: 3 }) // Inaktiv
      ];

      database.query.mockResolvedValueOnce(
        TestUtils.mockDbAntwort(aktiveTarife.filter(t => t.ist_aktiv))
      );

      // Act
      const response = await request(app)
        .get('/api/v1/preise/tarife')
        .expect(200);

      // Assert
      TestUtils.validiereApiResponse(response.body, true);
      expect(response.body.daten.tarife).toHaveLength(2);
      expect(response.body.daten.tarife.every(t => t.ist_aktiv)).toBe(true);
    });

    test('sollte Tarife nach Typ filtern', async () => {
      // Arrange
      const tarife = [
        TestUtils.erstelleTestTarif({ tarif_typ: 'fest' }),
        TestUtils.erstelleTestTarif({ tarif_typ: 'dynamisch' })
      ];

      database.query.mockResolvedValueOnce(
        TestUtils.mockDbAntwort([tarife[0]])
      );

      // Act
      const response = await request(app)
        .get('/api/v1/preise/tarife?typ=fest')
        .expect(200);

      // Assert
      expect(response.body.daten.tarife).toHaveLength(1);
      expect(response.body.daten.tarife[0].tarif_typ).toBe('fest');
    });
  });

  describe('GET /api/v1/preise/standorte/:plz', () => {
    test('sollte Standortinformationen für gültige PLZ zurückgeben', async () => {
      // Arrange
      const testPlz = TestUtils.erstelleTestPlz();
      database.query.mockResolvedValueOnce(TestUtils.mockDbAntwort([testPlz]));

      // Act
      const response = await request(app)
        .get(`/api/v1/preise/standorte/${testPlz.plz}`)
        .expect(200);

      // Assert
      TestUtils.validiereApiResponse(response.body, true);
      expect(response.body.daten.standort.plz).toBe(testPlz.plz);
      expect(response.body.daten.standort.stadt).toBe(testPlz.stadt);
      expect(response.body.daten.standort.netzbetreiber).toBe(testPlz.netzbetreiber);
    });

    test('sollte 404 für ungültige PLZ zurückgeben', async () => {
      // Arrange
      database.query.mockResolvedValueOnce(TestUtils.mockDbAntwort([]));

      // Act
      const response = await request(app)
        .get('/api/v1/preise/standorte/99999')
        .expect(404);

      // Assert
      TestUtils.validiereApiResponse(response.body, false);
      expect(response.body.nachricht).toContain('Standort nicht gefunden');
    });
  });

  describe('Validierung und Fehlerbehandlung', () => {
    test('sollte Validierungsfehler für ungültige PLZ zurückgeben', async () => {
      // Arrange
      const ungueltigeAnfragen = [
        { plz: '123' },        // Zu kurz
        { plz: '123456' },     // Zu lang  
        { plz: 'abcde' },      // Nicht numerisch
        { plz: '' }            // Leer
      ];

      // Act & Assert
      for (const anfrage of ungueltigeAnfragen) {
        const response = await request(app)
          .post('/api/v1/preise/berechnen')
          .send(anfrage)
          .expect(400);

        TestUtils.validiereApiResponse(response.body, false);
        expect(response.body.fehler).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              feld: 'plz'
            })
          ])
        );
      }
    });

    test('sollte Validierungsfehler für unrealistischen Verbrauch zurückgeben', async () => {
      // Arrange
      const unrealistischeAnfragen = [
        { plz: '10115', jahresverbrauch: 100 },    // Zu niedrig
        { plz: '10115', jahresverbrauch: 100000 }, // Zu hoch
        { plz: '10115', jahresverbrauch: -500 }    // Negativ
      ];

      // Act & Assert
      for (const anfrage of unrealistischeAnfragen) {
        const response = await request(app)
          .post('/api/v1/preise/berechnen')
          .send(anfrage)
          .expect(400);

        TestUtils.validiereApiResponse(response.body, false);
      }
    });

    test('sollte Datenbankfehler ordnungsgemäß behandeln', async () => {
      // Arrange
      database.query.mockRejectedValueOnce(new Error('Datenbankverbindung fehlgeschlagen'));

      const anfrage = {
        plz: '10115',
        jahresverbrauch: 3500
      };

      // Act
      const response = await request(app)
        .post('/api/v1/preise/berechnen')
        .send(anfrage)
        .expect(500);

      // Assert
      TestUtils.validiereApiResponse(response.body, false);
      expect(response.body.nachricht).toContain('Serverfehler');
    });
  });

  describe('Performance und Edge Cases', () => {
    test('sollte große Verbrauchsmengen effizient berechnen', async () => {
      // Arrange
      const testPlz = TestUtils.erstelleTestPlz();
      const testTarif = TestUtils.erstelleTestTarif();
      
      database.query
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([testPlz]))
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([{
          ...testTarif,
          arbeitspreis_cent_pro_kwh: 28.50,
          grundpreis_euro_pro_monat: 9.90
        }]));

      const anfrage = {
        plz: testPlz.plz,
        jahresverbrauch: 50000 // Maximum erlaubter Verbrauch
      };

      // Act
      const startZeit = Date.now();
      const response = await request(app)
        .post('/api/v1/preise/berechnen')
        .send(anfrage)
        .expect(200);
      const endZeit = Date.now();

      // Assert
      expect(endZeit - startZeit).toBeLessThan(1000); // Unter 1 Sekunde
      TestUtils.validiereApiResponse(response.body, true);
    });

    test('sollte multiple gleichzeitige Anfragen handhaben', async () => {
      // Arrange
      const testPlz = TestUtils.erstelleTestPlz();
      database.query
        .mockResolvedValue(TestUtils.mockDbAntwort([testPlz]))
        .mockResolvedValue(TestUtils.mockDbAntwort([]));

      const anfragen = Array(10).fill().map(() => 
        request(app)
          .post('/api/v1/preise/berechnen')
          .send({ plz: testPlz.plz })
      );

      // Act
      const responses = await Promise.all(anfragen);

      // Assert
      responses.forEach(response => {
        expect(response.status).toBe(200);
        TestUtils.validiereApiResponse(response.body, true);
      });
    });

    test('sollte Rundungsfehler bei Preisberechnungen vermeiden', async () => {
      // Arrange
      const testPlz = TestUtils.erstelleTestPlz();
      const tarifMitKommaWerten = {
        tarif_id: 1,
        arbeitspreis_cent_pro_kwh: 28.5749, // Viele Nachkommastellen
        grundpreis_euro_pro_monat: 9.999
      };
      
      database.query
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([testPlz]))
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([tarifMitKommaWerten]));

      const anfrage = {
        plz: testPlz.plz,
        jahresverbrauch: 3333 // Ungerade Zahl für Rundungstest
      };

      // Act
      const response = await request(app)
        .post('/api/v1/preise/berechnen')
        .send(anfrage)
        .expect(200);

      // Assert
      const tarif = response.body.daten.tarife[0];
      
      // Preise sollten auf 2 Nachkommastellen gerundet sein
      expect(tarif.monatspreis.toString()).toMatch(/^\d+\.\d{2}$/);
      expect(tarif.jahreskosten.toString()).toMatch(/^\d+\.\d{2}$/);
    });
  });
});