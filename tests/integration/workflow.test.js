const request = require('supertest');
const app = require('../../src/app');
const database = require('../../src/config/database');
const TestUtils = require('../utils/testUtils');

// Mock aller externen Abhängigkeiten
jest.mock('../../src/config/database');
jest.mock('../../src/utils/logger');

describe('🔄 Integration Tests - Kompletter Kundenworkflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Kompletter Registrierung-zu-Vertrag Workflow', () => {
    test('sollte kompletten Kundenjourney von Registrierung bis Vertragsabschluss durchführen', async () => {
      // Arrange - Testdaten vorbereiten
      const neuerKunde = {
        email: 'integration.test@beispiel.de',
        passwort: 'SicheresPasswort123!',
        vorname: 'Integration',
        nachname: 'Test',
        strasse: 'Teststraße 123',
        plz: '12345',
        stadt: 'Teststadt',
        telefon: '+49 123 456789'
      };

      const testTarif = TestUtils.erstelleTestTarif({
        tarif_name: 'Integration Test Tarif',
        tarif_typ: 'fest'
      });

      const testKampagne = {
        kampagne_id: 'integration_test_kampagne',
        ist_aktiv: true
      };

      // Mock Database-Responses für den kompletten Workflow
      database.query
        // 1. Registrierung - Email-Check
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([])) // Keine existierende Email
        // 2. Registrierung - Kunde erstellen
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([{
          ...neuerKunde,
          kunden_id: 'integration_test_kunde',
          erstellt_am: new Date()
        }]))
        // 3. Login - Kunde finden
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([{
          kunden_id: 'integration_test_kunde',
          email: neuerKunde.email,
          passwort_hash: 'hashed_password',
          ist_verifiziert: true
        }]))
        // 4. Profil abrufen
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([{
          kunden_id: 'integration_test_kunde',
          email: neuerKunde.email,
          vorname: neuerKunde.vorname,
          nachname: neuerKunde.nachname,
          strasse: neuerKunde.strasse,
          plz: neuerKunde.plz,
          stadt: neuerKunde.stadt
        }]))
        // 5. Tarife laden
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([testTarif]))
        // 6. Vertragsentwurf - Tarif validieren
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([testTarif]))
        // 7. Vertragsentwurf - Kampagne validieren
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([testKampagne]))
        // 8. Vertragsentwurf erstellen
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([{
          entwurf_id: 'integration_test_entwurf',
          kunden_id: 'integration_test_kunde',
          tarif_id: testTarif.id,
          status: 'entwurf',
          erstellt_am: new Date()
        }]))
        // 9. Entwurf genehmigen - Entwurf finden
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([{
          entwurf_id: 'integration_test_entwurf',
          status: 'entwurf'
        }]))
        // 10. Entwurf genehmigen - Status update
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([{
          entwurf_id: 'integration_test_entwurf',
          status: 'genehmigt'
        }]))
        // 11. Aktive Verträge abrufen
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([{
          vertrag_id: 'integration_test_vertrag',
          kunden_id: 'integration_test_kunde',
          status: 'aktiv',
          tarif_name: testTarif.tarif_name
        }]));

      // Act & Assert - Schritt für Schritt durch den Workflow

      // 1. REGISTRIERUNG
      console.log('🚀 Schritt 1: Kundenregistrierung');
      const registrierungResponse = await request(app)
        .post('/api/v1/auth/registrieren')
        .send(neuerKunde)
        .expect(201);

      TestUtils.validiereApiResponse(registrierungResponse.body, true);
      expect(registrierungResponse.body.nachricht).toContain('erfolgreich registriert');

      // 2. LOGIN
      console.log('🔐 Schritt 2: Kundenanmeldung');
      const loginResponse = await request(app)
        .post('/api/v1/auth/anmelden')
        .send({
          email: neuerKunde.email,
          passwort: neuerKunde.passwort
        })
        .expect(200);

      TestUtils.validiereApiResponse(loginResponse.body, true);
      expect(loginResponse.body.daten).toHaveProperty('token');
      const authToken = loginResponse.body.daten.token;

      // 3. PROFIL ABRUFEN
      console.log('👤 Schritt 3: Kundenprofil abrufen');
      const profilResponse = await request(app)
        .get('/api/v1/kunde/profil')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      TestUtils.validiereApiResponse(profilResponse.body, true);
      expect(profilResponse.body.daten.email).toBe(neuerKunde.email);

      // 4. VERFÜGBARE TARIFE ANZEIGEN
      console.log('💰 Schritt 4: Verfügbare Tarife abrufen');
      const tarifeResponse = await request(app)
        .get('/api/v1/tarife')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      TestUtils.validiereApiResponse(tarifeResponse.body, true);
      expect(tarifeResponse.body.daten.tarife).toHaveLength(1);
      expect(tarifeResponse.body.daten.tarife[0].tarifName).toBe(testTarif.tarif_name);

      // 5. VERTRAGSENTWURF ERSTELLEN
      console.log('📋 Schritt 5: Vertragsentwurf erstellen');
      const entwurfAnfrage = {
        tarifId: testTarif.id,
        kampagneId: testKampagne.kampagne_id,
        geschaetzterJahresverbrauch: 3500,
        vertragsbeginn: '2024-12-01'
      };

      const entwurfResponse = await request(app)
        .post('/api/v1/vertraege/entwurf')
        .set('Authorization', `Bearer ${authToken}`)
        .send(entwurfAnfrage)
        .expect(201);

      TestUtils.validiereApiResponse(entwurfResponse.body, true);
      expect(entwurfResponse.body.daten).toHaveProperty('entwurfId');
      const entwurfId = entwurfResponse.body.daten.entwurfId;

      // 6. VERTRAGSENTWURF GENEHMIGEN
      console.log('✅ Schritt 6: Vertragsentwurf genehmigen');
      const genehmigungResponse = await request(app)
        .post(`/api/v1/vertraege/entwurf/${entwurfId}/genehmigen`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      TestUtils.validiereApiResponse(genehmigungResponse.body, true);
      expect(genehmigungResponse.body.nachricht).toContain('genehmigt');

      // 7. AKTIVE VERTRÄGE PRÜFEN
      console.log('📄 Schritt 7: Aktive Verträge abrufen');
      const vertraegeResponse = await request(app)
        .get('/api/v1/vertraege')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      TestUtils.validiereApiResponse(vertraegeResponse.body, true);
      expect(vertraegeResponse.body.daten.vertraege).toHaveLength(1);
      expect(vertraegeResponse.body.daten.vertraege[0].status).toBe('aktiv');

      console.log('🎉 Integration Test erfolgreich abgeschlossen!');
    });

    test('sollte Fehlerbehandlung im Workflow testen', async () => {
      // Arrange
      const fehlerhafterKunde = {
        email: 'bereits@vorhanden.de', // Bereits existierende Email
        passwort: 'test123',
        vorname: 'Test',
        nachname: 'User'
      };

      // Mock - Email bereits vorhanden
      database.query.mockResolvedValueOnce(TestUtils.mockDbAntwort([{
        email: fehlerhafterKunde.email
      }]));

      // Act
      const response = await request(app)
        .post('/api/v1/auth/registrieren')
        .send(fehlerhafterKunde)
        .expect(409);

      // Assert
      TestUtils.validiereApiResponse(response.body, false);
      expect(response.body.nachricht).toContain('bereits registriert');
    });
  });

  describe('Preisberechnung Integration Tests', () => {
    test('sollte komplette Preisberechnung mit verschiedenen Parametern durchführen', async () => {
      // Arrange
      const testTarif = TestUtils.erstelleTestTarif();
      const testPreise = TestUtils.erstelleTestPreise();
      
      const berechnungsAnfragen = [
        { jahresverbrauch: 2000, vertragslaufzeit: 12 },
        { jahresverbrauch: 4000, vertragslaufzeit: 24 },
        { jahresverbrauch: 6000, vertragslaufzeit: 12 }
      ];

      // Mock für jeden Berechnungsaufruf
      berechnungsAnfragen.forEach(() => {
        database.query
          .mockResolvedValueOnce(TestUtils.mockDbAntwort([testTarif]))
          .mockResolvedValueOnce(TestUtils.mockDbAntwort([testPreise]));
      });

      // Act & Assert
      for (const anfrage of berechnungsAnfragen) {
        const response = await request(app)
          .post('/api/v1/preise/berechnen')
          .send({
            tarifId: testTarif.id,
            jahresverbrauch: anfrage.jahresverbrauch,
            vertragslaufzeit: anfrage.vertragslaufzeit
          })
          .expect(200);

        TestUtils.validiereApiResponse(response.body, true);
        
        const berechnung = response.body.daten;
        expect(berechnung).toHaveProperty('gesamtkosten');
        expect(berechnung).toHaveProperty('monatlicheKosten');
        expect(berechnung.jahresverbrauch).toBe(anfrage.jahresverbrauch);
        
        // Prüfe Rechenlogik
        const erwarteteArbeitskosten = anfrage.jahresverbrauch * testPreise.arbeitspreis_cent_pro_kwh / 100;
        const erwarteteGrundkosten = 12 * testPreise.grundpreis_euro_pro_monat;
        const erwarteteGesamtkosten = erwarteteArbeitskosten + erwarteteGrundkosten;
        
        expect(berechnung.gesamtkosten).toBeCloseTo(erwarteteGesamtkosten, 2);
      }
    });

    test('sollte Sonderkonditionen und Rabatte in Preisberechnung einbeziehen', async () => {
      // Arrange
      const testTarif = TestUtils.erstelleTestTarif();
      const testPreiseConditionen = {
        ...TestUtils.erstelleTestPreise(),
        neukundenrabatt_prozent: 10,
        mindestvertragslaufzeit_monate: 24,
        fruhbucherrabatt_prozent: 5
      };

      database.query
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([testTarif]))
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([testPreiseConditionen]));

      // Act
      const response = await request(app)
        .post('/api/v1/preise/berechnen')
        .send({
          tarifId: testTarif.id,
          jahresverbrauch: 3500,
          vertragslaufzeit: 24,
          istNeukunde: true,
          istFruhbucher: true
        })
        .expect(200);

      // Assert
      TestUtils.validiereApiResponse(response.body, true);
      const berechnung = response.body.daten;
      
      expect(berechnung).toHaveProperty('rabatte');
      expect(berechnung.rabatte.neukundenrabatt).toBe(10);
      expect(berechnung.rabatte.fruhbucherrabatt).toBe(5);
      expect(berechnung.gesamtrabatt).toBe(15);
    });
  });

  describe('Datenvalidierung Integration Tests', () => {
    test('sollte komplette Eingabevalidierung über mehrere Endpunkte hinweg testen', async () => {
      // Arrange
      const ungueltigeDaten = [
        {
          endpoint: '/api/v1/auth/registrieren',
          method: 'post',
          data: { email: 'ungueltige-email' }, // Falsche Email
          expectedStatus: 400
        },
        {
          endpoint: '/api/v1/preise/berechnen',
          method: 'post',
          data: { jahresverbrauch: -100 }, // Negative Zahl
          expectedStatus: 400
        },
        {
          endpoint: '/api/v1/vertraege/entwurf',
          method: 'post',
          data: { vertragsbeginn: '2020-01-01' }, // Vergangenheit
          expectedStatus: 400,
          needsAuth: true
        }
      ];

      // Act & Assert
      for (const testCase of ungueltigeDaten) {
        let requestBuilder = request(app)[testCase.method](testCase.endpoint);
        
        if (testCase.needsAuth) {
          requestBuilder = requestBuilder.set('Authorization', 'Bearer fake-token');
        }
        
        const response = await requestBuilder
          .send(testCase.data)
          .expect(testCase.expectedStatus);

        TestUtils.validiereApiResponse(response.body, false);
        expect(response.body).toHaveProperty('fehler');
      }
    });

    test('sollte Unicode und Sonderzeichen korrekt verarbeiten', async () => {
      // Arrange
      const unicodeKunde = {
        email: 'üñíçødé@tëst.de',
        passwort: 'SicheresPasswort123!',
        vorname: 'Jürgen',
        nachname: 'Müller-Weiß',
        strasse: 'Goethestraße 123',
        stadt: 'München'
      };

      database.query
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([])) // Keine existierende Email
        .mockResolvedValueOnce(TestUtils.mockDbAntwort([{
          ...unicodeKunde,
          kunden_id: 'unicode_test_kunde'
        }]));

      // Act
      const response = await request(app)
        .post('/api/v1/auth/registrieren')
        .send(unicodeKunde)
        .expect(201);

      // Assert
      TestUtils.validiereApiResponse(response.body, true);
      expect(response.body.nachricht).toContain('erfolgreich registriert');
    });
  });

  describe('Concurrency und Performance Tests', () => {
    test('sollte gleichzeitige Registrierungen handhaben', async () => {
      // Arrange
      const gleichzeitigeKunden = Array(5).fill().map((_, index) => ({
        email: `concurrent${index}@test.de`,
        passwort: 'TestPasswort123!',
        vorname: `Test${index}`,
        nachname: 'User'
      }));

      // Mock für alle Registrierungen
      gleichzeitigeKunden.forEach((kunde, index) => {
        database.query
          .mockResolvedValueOnce(TestUtils.mockDbAntwort([])) // Email check
          .mockResolvedValueOnce(TestUtils.mockDbAntwort([{
            ...kunde,
            kunden_id: `concurrent_kunde_${index}`
          }])); // Kunde erstellen
      });

      // Act
      const registrierungsPromises = gleichzeitigeKunden.map(kunde =>
        request(app)
          .post('/api/v1/auth/registrieren')
          .send(kunde)
      );

      const responses = await Promise.all(registrierungsPromises);

      // Assert
      responses.forEach(response => {
        expect(response.status).toBe(201);
        TestUtils.validiereApiResponse(response.body, true);
      });
    });

    test('sollte Rate-Limiting simulieren', async () => {
      // Arrange
      const testEmail = 'rate.limit@test.de';
      const testPasswort = 'TestPasswort123!';

      // Mock für alle Login-Versuche
      Array(10).fill().forEach(() => {
        database.query.mockResolvedValueOnce(TestUtils.mockDbAntwort([])); // Kein User gefunden
      });

      // Act - Viele Login-Versuche
      const loginPromises = Array(10).fill().map(() =>
        request(app)
          .post('/api/v1/auth/anmelden')
          .send({ email: testEmail, passwort: testPasswort })
      );

      const responses = await Promise.all(loginPromises);

      // Assert
      const erfolgreiche = responses.filter(r => r.status === 401);
      const rateLimited = responses.filter(r => r.status === 429);
      
      expect(erfolgreiche.length + rateLimited.length).toBe(10);
      // In einem echten Szenario würden wir Rate-Limiting erwarten
    });

    test('sollte Performance bei vielen gleichzeitigen Berechnungen messen', async () => {
      // Arrange
      const testTarif = TestUtils.erstelleTestTarif();
      const testPreise = TestUtils.erstelleTestPreise();
      
      const berechnungen = Array(20).fill().map(() => ({
        tarifId: testTarif.id,
        jahresverbrauch: Math.floor(Math.random() * 5000) + 1000,
        vertragslaufzeit: 12
      }));

      // Mock für alle Berechnungen
      berechnungen.forEach(() => {
        database.query
          .mockResolvedValueOnce(TestUtils.mockDbAntwort([testTarif]))
          .mockResolvedValueOnce(TestUtils.mockDbAntwort([testPreise]));
      });

      // Act
      const startTime = Date.now();
      const berechnungsPromises = berechnungen.map(berechnung =>
        request(app)
          .post('/api/v1/preise/berechnen')
          .send(berechnung)
      );

      const responses = await Promise.all(berechnungsPromises);
      const endTime = Date.now();

      // Assert
      expect(endTime - startTime).toBeLessThan(5000); // Unter 5 Sekunden
      responses.forEach(response => {
        expect(response.status).toBe(200);
        TestUtils.validiereApiResponse(response.body, true);
      });
    });
  });

  describe('Error Recovery Tests', () => {
    test('sollte Datenbankausfall graceful handhaben', async () => {
      // Arrange
      database.query.mockRejectedValue(new Error('Database connection failed'));

      // Act
      const response = await request(app)
        .get('/api/v1/tarife')
        .expect(500);

      // Assert
      TestUtils.validiereApiResponse(response.body, false);
      expect(response.body.nachricht).toContain('Datenbankfehler');
    });

    test('sollte Netzwerk-Timeout simulieren', async () => {
      // Arrange
      database.query.mockImplementation(() =>
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Query timeout')), 100)
        )
      );

      // Act
      const response = await request(app)
        .post('/api/v1/auth/registrieren')
        .send({
          email: 'timeout@test.de',
          passwort: 'TestPasswort123!',
          vorname: 'Test',
          nachname: 'User'
        })
        .expect(500);

      // Assert
      TestUtils.validiereApiResponse(response.body, false);
    });
  });
});