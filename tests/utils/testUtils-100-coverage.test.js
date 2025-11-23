const { TestUtils } = require('./testUtils');

describe('🎯 100% Coverage TestUtils Tests', () => {
  describe('Data Factory Coverage', () => {
    test('sollte alle Kunden-Daten-Variationen erstellen', () => {
      // Standard Kunde
      const standardKunde = TestUtils.erstelleTestKunde();
      expect(standardKunde).toHaveProperty('kunden_id');
      expect(standardKunde).toHaveProperty('email');
      expect(standardKunde).toHaveProperty('vorname');
      expect(standardKunde).toHaveProperty('nachname');

      // Kunde mit Overrides
      const customKunde = TestUtils.erstelleTestKunde({
        email: 'custom@test.de',
        vorname: 'Custom',
        ist_aktiv: false
      });
      expect(customKunde.email).toBe('custom@test.de');
      expect(customKunde.vorname).toBe('Custom');
      expect(customKunde.ist_aktiv).toBe(false);

      // Premium Kunde
      const premiumKunde = TestUtils.erstelleTestKunde({
        kunde_typ: 'premium',
        jahresverbrauch: 10000,
        verträge_anzahl: 3
      });
      expect(premiumKunde.kunde_typ).toBe('premium');
      expect(premiumKunde.jahresverbrauch).toBe(10000);
    });

    test('sollte alle Tarif-Variationen erstellen', () => {
      // Fest-Tarif
      const festTarif = TestUtils.erstelleTestTarif({ tarif_typ: 'fest' });
      expect(festTarif.tarif_typ).toBe('fest');
      expect(festTarif).toHaveProperty('arbeitspreis_cent_pro_kwh');
      expect(festTarif).toHaveProperty('grundpreis_euro_pro_monat');

      // Dynamischer Tarif
      const dynamischTarif = TestUtils.erstelleTestTarif({ 
        tarif_typ: 'dynamisch',
        ist_aktiv: true,
        mindestvertragslaufzeit_monate: 1
      });
      expect(dynamischTarif.tarif_typ).toBe('dynamisch');
      expect(dynamischTarif.ist_aktiv).toBe(true);

      // Grün-Tarif
      const gruenTarif = TestUtils.erstelleTestTarif({
        tarif_typ: 'gruen',
        oeko_zertifikat: true,
        co2_neutral: true
      });
      expect(gruenTarif.tarif_typ).toBe('gruen');
      expect(gruenTarif.oeko_zertifikat).toBe(true);
    });

    test('sollte alle Preis-Konfigurationen erstellen', () => {
      // Standard Preise
      const standardPreise = TestUtils.erstelleTestPreise();
      expect(standardPreise.arbeitspreis_cent_pro_kwh).toBe(28.50);
      expect(standardPreise.grundpreis_euro_pro_monat).toBe(9.90);

      // Premium Preise
      const premiumPreise = TestUtils.erstelleTestPreise({
        arbeitspreis_cent_pro_kwh: 35.00,
        grundpreis_euro_pro_monat: 15.90,
        neukundenrabatt_prozent: 15
      });
      expect(premiumPreise.arbeitspreis_cent_pro_kwh).toBe(35.00);
      expect(premiumPreise.neukundenrabatt_prozent).toBe(15);

      // Günstige Preise
      const guenstigePreise = TestUtils.erstelleTestPreise({
        arbeitspreis_cent_pro_kwh: 22.00,
        grundpreis_euro_pro_monat: 5.90
      });
      expect(guenstigePreise.arbeitspreis_cent_pro_kwh).toBe(22.00);
    });

    test('sollte alle Vertragsentwurf-Szenarien erstellen', () => {
      // Standard Entwurf
      const standardEntwurf = TestUtils.erstelleTestVertragsentwurf();
      expect(standardEntwurf.status).toBe('entwurf');
      expect(standardEntwurf).toHaveProperty('entwurf_id');
      expect(standardEntwurf).toHaveProperty('kunden_id');

      // Genehmigter Entwurf
      const genehmigterEntwurf = TestUtils.erstelleTestVertragsentwurf({
        status: 'genehmigt',
        genehmigt_am: new Date(),
        genehmigt_von: 'system'
      });
      expect(genehmigterEntwurf.status).toBe('genehmigt');
      expect(genehmigterEntwurf.genehmigt_am).toBeInstanceOf(Date);

      // Abgelehnter Entwurf
      const abgelehnterEntwurf = TestUtils.erstelleTestVertragsentwurf({
        status: 'abgelehnt',
        ablehnungsgrund: 'Unvollständige Angaben'
      });
      expect(abgelehnterEntwurf.status).toBe('abgelehnt');
      expect(abgelehnterEntwurf.ablehnungsgrund).toBe('Unvollständige Angaben');
    });

    test('sollte alle PLZ-Testdaten erstellen', () => {
      // Berlin PLZ
      const berlinPlz = TestUtils.erstelleTestPlz({ plz: '10115', stadt: 'Berlin' });
      expect(berlinPlz.plz).toBe('10115');
      expect(berlinPlz.stadt).toBe('Berlin');
      expect(berlinPlz.verfuegbar).toBe(true);

      // München PLZ
      const muenchenPlz = TestUtils.erstelleTestPlz({ 
        plz: '80331', 
        stadt: 'München',
        bundesland: 'Bayern'
      });
      expect(muenchenPlz.plz).toBe('80331');
      expect(muenchenPlz.bundesland).toBe('Bayern');

      // Nicht verfügbare PLZ
      const nichtVerfuegbarPlz = TestUtils.erstelleTestPlz({
        plz: '99999',
        verfuegbar: false,
        grund: 'Außerhalb Liefergebiet'
      });
      expect(nichtVerfuegbarPlz.verfuegbar).toBe(false);
    });
  });

  describe('Mock Helper Coverage', () => {
    test('sollte DB-Antworten korrekt mocken', () => {
      // Erfolgreiche Antwort
      const erfolgreicheAntwort = TestUtils.mockDbAntwort([
        { id: 1, name: 'Test' },
        { id: 2, name: 'Test2' }
      ]);
      expect(erfolgreicheAntwort.rows).toHaveLength(2);
      expect(erfolgreicheAntwort.rowCount).toBe(2);

      // Leere Antwort
      const leereAntwort = TestUtils.mockDbAntwort([]);
      expect(leereAntwort.rows).toHaveLength(0);
      expect(leereAntwort.rowCount).toBe(0);

      // Einzelnes Ergebnis
      const einzelErgebnis = TestUtils.mockDbAntwort([{ id: 42 }]);
      expect(einzelErgebnis.rows).toHaveLength(1);
      expect(einzelErgebnis.rows[0].id).toBe(42);
    });

    test('sollte API-Response-Validierung abdecken', () => {
      // Erfolgreiche Response
      const erfolgreicheResponse = {
        erfolg: true,
        nachricht: 'Operation erfolgreich',
        daten: { id: 123 }
      };
      expect(() => TestUtils.validiereApiResponse(erfolgreicheResponse, true)).not.toThrow();

      // Fehler-Response
      const fehlerResponse = {
        erfolg: false,
        nachricht: 'Fehler aufgetreten',
        fehler: [{ feld: 'email', nachricht: 'Ungültig' }]
      };
      expect(() => TestUtils.validiereApiResponse(fehlerResponse, false)).not.toThrow();

      // Ungültige Response
      const ungueltigeResponse = { invalid: true };
      expect(() => TestUtils.validiereApiResponse(ungueltigeResponse, true)).toThrow();
    });

    test('sollte Auth-Token-Mocking abdecken', () => {
      // Gültiger Token
      const gueltigerToken = TestUtils.erstelleTestToken({ kunden_id: 'test_123' });
      expect(gueltigerToken).toMatch(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);

      // Admin Token
      const adminToken = TestUtils.erstelleTestToken({ 
        kunden_id: 'admin_1',
        rolle: 'admin',
        berechtigungen: ['all']
      });
      expect(adminToken).toBeDefined();
      expect(typeof adminToken).toBe('string');

      // Abgelaufener Token
      const abgelaufenerToken = TestUtils.erstelleTestToken({
        kunden_id: 'user_1',
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 Stunde in der Vergangenheit
      });
      expect(abgelaufenerToken).toBeDefined();
    });
  });

  describe('Validation Helper Coverage', () => {
    test('sollte alle Validierungs-Hilfsfunktionen abdecken', () => {
      // Email-Validierung
      expect(TestUtils.istGueltigeEmail('test@beispiel.de')).toBe(true);
      expect(TestUtils.istGueltigeEmail('ungültig@')).toBe(false);
      expect(TestUtils.istGueltigeEmail('ohne-at-zeichen.de')).toBe(false);

      // PLZ-Validierung
      expect(TestUtils.istGueltigePlz('12345')).toBe(true);
      expect(TestUtils.istGueltigePlz('1234')).toBe(false);
      expect(TestUtils.istGueltigePlz('abcde')).toBe(false);

      // Telefon-Validierung
      expect(TestUtils.istGueltigeTelefon('+49 123 456789')).toBe(true);
      expect(TestUtils.istGueltigeTelefon('0123456789')).toBe(true);
      expect(TestUtils.istGueltigeTelefon('123')).toBe(false);

      // Passwort-Stärke
      expect(TestUtils.istStarkesPasswort('SicheresPasswort123!')).toBe(true);
      expect(TestUtils.istStarkesPasswort('schwach')).toBe(false);
      expect(TestUtils.istStarkesPasswort('NurBuchstaben')).toBe(false);
    });

    test('sollte Datentyp-Validierungen abdecken', () => {
      // Numerische Validierungen
      expect(TestUtils.istGueltigerJahresverbrauch(3500)).toBe(true);
      expect(TestUtils.istGueltigerJahresverbrauch(100)).toBe(false);
      expect(TestUtils.istGueltigerJahresverbrauch(100000)).toBe(false);

      // Haushaltsgrößen-Validierung
      expect(TestUtils.istGueltigeHaushaltgroesse(3)).toBe(true);
      expect(TestUtils.istGueltigeHaushaltgroesse(0)).toBe(false);
      expect(TestUtils.istGueltigeHaushaltgroesse(25)).toBe(false);

      // Tarif-Typ-Validierung
      expect(TestUtils.istGueltigerTariftyp('fest')).toBe(true);
      expect(TestUtils.istGueltigerTariftyp('dynamisch')).toBe(true);
      expect(TestUtils.istGueltigerTariftyp('gruen')).toBe(true);
      expect(TestUtils.istGueltigerTariftyp('ungueltig')).toBe(false);
    });

    test('sollte Date-Helper abdecken', () => {
      // Datum-Generierung
      const heuteISO = TestUtils.heuteISO();
      expect(heuteISO).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      // Zufälliges Datum
      const zufallsDatum = TestUtils.zufaelligesDatum(2020, 2024);
      expect(zufallsDatum.getFullYear()).toBeGreaterThanOrEqual(2020);
      expect(zufallsDatum.getFullYear()).toBeLessThanOrEqual(2024);

      // Datum in Vergangenheit
      const vergangenheit = TestUtils.datumInVergangenheit(30); // 30 Tage zurück
      expect(vergangenheit.getTime()).toBeLessThan(Date.now());

      // Datum in Zukunft
      const zukunft = TestUtils.datumInZukunft(30); // 30 Tage voraus
      expect(zukunft.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Performance Helper Coverage', () => {
    test('sollte Performance-Messungen unterstützen', () => {
      const timer = TestUtils.startePerformanceTimer();
      expect(timer).toHaveProperty('start');
      expect(timer.start).toBeInstanceOf(Date);

      // Simuliere kurze Delay
      setTimeout(() => {
        const duration = TestUtils.beendePerformanceTimer(timer);
        expect(duration).toBeGreaterThan(0);
        expect(duration).toBeLessThan(1000); // Unter 1 Sekunde
      }, 10);
    });

    test('sollte Memory-Usage-Tracking unterstützen', () => {
      const startMemory = TestUtils.aktuelleMemoryUsage();
      expect(startMemory).toHaveProperty('heapUsed');
      expect(startMemory).toHaveProperty('heapTotal');
      expect(startMemory.heapUsed).toBeGreaterThan(0);

      // Memory-Diff
      const diff = TestUtils.memoryUsageDiff(startMemory, TestUtils.aktuelleMemoryUsage());
      expect(diff).toHaveProperty('heapUsedDiff');
      expect(typeof diff.heapUsedDiff).toBe('number');
    });

    test('sollte Test-Daten-Cleanup unterstützen', () => {
      // Erstelle Test-Daten
      const testDaten = {
        kunden: Array(100).fill().map(() => TestUtils.erstelleTestKunde()),
        tarife: Array(10).fill().map(() => TestUtils.erstelleTestTarif())
      };

      expect(testDaten.kunden).toHaveLength(100);
      expect(testDaten.tarife).toHaveLength(10);

      // Cleanup
      TestUtils.bereinigTestDaten();
      // Nach Cleanup sollten keine internen Caches mehr existieren
      expect(TestUtils.getCacheGroesse()).toBe(0);
    });
  });

  describe('Edge Cases und Error Handling', () => {
    test('sollte null/undefined Eingaben handhaben', () => {
      expect(() => TestUtils.erstelleTestKunde(null)).not.toThrow();
      expect(() => TestUtils.erstelleTestKunde(undefined)).not.toThrow();
      expect(() => TestUtils.mockDbAntwort(null)).not.toThrow();
      expect(() => TestUtils.mockDbAntwort(undefined)).not.toThrow();
    });

    test('sollte sehr große Datensätze handhaben', () => {
      // Großer Kunde-Datensatz
      const grosserKunde = TestUtils.erstelleTestKunde({
        notizen: 'X'.repeat(10000),
        präferenzen: Array(100).fill().map(() => ({ key: 'value' })),
        vertragshistorie: Array(50).fill().map(() => TestUtils.erstelleTestVertragsentwurf())
      });

      expect(grosserKunde.notizen.length).toBe(10000);
      expect(grosserKunde.präferenzen).toHaveLength(100);

      // Performance sollte akzeptabel bleiben
      const startTime = Date.now();
      TestUtils.validiereApiResponse({
        erfolg: true,
        nachricht: 'Test',
        daten: grosserKunde
      }, true);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Unter 100ms
    });

    test('sollte Unicode und Sonderzeichen handhaben', () => {
      const unicodeKunde = TestUtils.erstelleTestKunde({
        vorname: 'Jürgen',
        nachname: 'Müller-Weiß',
        stadt: 'München',
        notizen: '中文 🚀 äöüß',
        email: 'üñíçødé@tëst.de'
      });

      expect(unicodeKunde.vorname).toBe('Jürgen');
      expect(unicodeKunde.notizen).toContain('🚀');
      expect(unicodeKunde.email).toContain('ü');
    });

    test('sollte zirkuläre Referenzen vermeiden', () => {
      const kunde = TestUtils.erstelleTestKunde();
      kunde.selbstReferenz = kunde; // Zirkuläre Referenz hinzufügen

      // Sollte nicht zu Endlosschleife führen
      expect(() => TestUtils.mockDbAntwort([kunde])).not.toThrow();
    });
  });
});