const TestUtils = require('./testUtils');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Mock JWT Secret für Tests
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRES_IN = '1h';

describe('TestUtils - Extended Coverage Tests', () => {
  
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });
  
  describe('JWT Token Erstellung', () => {
    test('erstelleJwtToken mit Standard-Payload', () => {
      const token = TestUtils.erstelleJwtToken();
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT hat 3 Teile
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('kunden_id');
      expect(decoded).toHaveProperty('email');
    });

    test('erstelleJwtToken mit Custom-Payload', () => {
      const customPayload = {
        id: 'custom-id-123',
        kunden_id: 'kunde_custom_123',
        email: 'custom@test.de',
        rolle: 'admin'
      };
      
      const token = TestUtils.erstelleJwtToken(customPayload);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded.id).toBe('custom-id-123');
      expect(decoded.kunden_id).toBe('kunde_custom_123');
      expect(decoded.email).toBe('custom@test.de');
      expect(decoded.rolle).toBe('admin');
    });

    test('erstelleJwtToken mit partiellen Überschreibungen', () => {
      const token = TestUtils.erstelleJwtToken({ email: 'override@test.de' });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      expect(decoded.email).toBe('override@test.de');
      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('kunden_id');
    });
  });

  describe('Passwort Hashing', () => {
    test('hashePasswort erstellt gültigen Hash', async () => {
      const passwort = 'TestPasswort123!';
      const hash = await TestUtils.hashePasswort(passwort);
      
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(passwort);
      expect(hash.startsWith('$2a$12$')).toBe(true);
      
      // Prüfe Hash-Validierung
      const istGueltig = await bcrypt.compare(passwort, hash);
      expect(istGueltig).toBe(true);
    });

    test('hashePasswort mit verschiedenen Passwörtern', async () => {
      const passwort1 = 'Passwort1';
      const passwort2 = 'Passwort2';
      
      const hash1 = await TestUtils.hashePasswort(passwort1);
      const hash2 = await TestUtils.hashePasswort(passwort2);
      
      expect(hash1).not.toBe(hash2);
      
      const valid1 = await bcrypt.compare(passwort1, hash1);
      const valid2 = await bcrypt.compare(passwort2, hash2);
      
      expect(valid1).toBe(true);
      expect(valid2).toBe(true);
    });

    test('hashePasswort mit leerem Passwort', async () => {
      const hash = await TestUtils.hashePasswort('');
      expect(typeof hash).toBe('string');
      
      const valid = await bcrypt.compare('', hash);
      expect(valid).toBe(true);
    });
  });

  describe('Test-Kunde Erstellung', () => {
    test('erstelleTestKunde mit Standard-Daten', () => {
      const kunde = TestUtils.erstelleTestKunde();
      
      expect(kunde).toHaveProperty('kunden_id');
      expect(kunde.kunden_id).toMatch(/^kunde_\d+_[a-z0-9]{9}$/);
      expect(kunde.email).toMatch(/^test\.\d+@example\.com$/);
      expect(kunde.vorname).toBe('Max');
      expect(kunde.nachname).toBe('Mustermann');
      expect(kunde.telefon).toBe('+49 30 12345678');
      expect(kunde.strasse).toBe('Teststraße');
      expect(kunde.hausnummer).toBe('123');
      expect(kunde.plz).toBe('10115');
      expect(kunde.stadt).toBe('Berlin');
      expect(kunde.bezirk).toBe('Mitte');
      expect(kunde.land).toBe('Deutschland');
      expect(kunde.bevorzugte_sprache).toBe('de');
      expect(kunde.marketing_einverstaendnis).toBe(false);
      expect(kunde.newsletter_einverstaendnis).toBe(false);
      expect(kunde.ist_aktiv).toBe(true);
      expect(kunde.ist_verifiziert).toBe(true);
      expect(kunde.erstellt_am).toBeInstanceOf(Date);
      expect(kunde.aktualisiert_am).toBeInstanceOf(Date);
    });

    test('erstelleTestKunde mit Überschreibungen', () => {
      const ueberschreibungen = {
        vorname: 'Anna',
        nachname: 'Schmidt',
        email: 'anna@test.de',
        ist_aktiv: false,
        bevorzugte_sprache: 'en'
      };
      
      const kunde = TestUtils.erstelleTestKunde(ueberschreibungen);
      
      expect(kunde.vorname).toBe('Anna');
      expect(kunde.nachname).toBe('Schmidt');
      expect(kunde.email).toBe('anna@test.de');
      expect(kunde.ist_aktiv).toBe(false);
      expect(kunde.bevorzugte_sprache).toBe('en');
      
      // Standard-Werte sollten erhalten bleiben
      expect(kunde.telefon).toBe('+49 30 12345678');
      expect(kunde.plz).toBe('10115');
    });

    test('erstelleTestKunde mit leeren Überschreibungen', () => {
      const kunde1 = TestUtils.erstelleTestKunde({});
      // Kleine Verzögerung für eindeutige Timestamps
      jest.advanceTimersByTime(1);
      const kunde2 = TestUtils.erstelleTestKunde();
      
      // Beide sollten alle Standard-Eigenschaften haben
      expect(kunde1.vorname).toBe(kunde2.vorname);
      expect(kunde1.nachname).toBe(kunde2.nachname);
      
      // Aber eindeutige IDs haben (falls timestamp-basiert)
      expect(kunde1.kunden_id).not.toBe(kunde2.kunden_id);
      // Email kann gleich sein da sie beide auf Date.now() basieren
      expect(kunde1.email).toMatch(/^test\.\d+@example\.com$/);
      expect(kunde2.email).toMatch(/^test\.\d+@example\.com$/);
    });

    test('erstelleTestKunde generiert eindeutige IDs', () => {
      const kunde1 = TestUtils.erstelleTestKunde();
      jest.advanceTimersByTime(10); // Kleine Verzögerung
      const kunde2 = TestUtils.erstelleTestKunde();
      jest.advanceTimersByTime(10); // Kleine Verzögerung
      const kunde3 = TestUtils.erstelleTestKunde();
      
      expect(kunde1.kunden_id).not.toBe(kunde2.kunden_id);
      expect(kunde2.kunden_id).not.toBe(kunde3.kunden_id);
      expect(kunde1.kunden_id).not.toBe(kunde3.kunden_id);
      
      // E-Mails sollten Format haben aber können gleich sein wenn schnell generiert
      expect(kunde1.email).toMatch(/^test\.\d+@example\.com$/);
      expect(kunde2.email).toMatch(/^test\.\d+@example\.com$/);
      expect(kunde3.email).toMatch(/^test\.\d+@example\.com$/);
    });
  });

  describe('Test-Tarif Erstellung', () => {
    test('erstelleTestTarif mit Standard-Daten', () => {
      const tarif = TestUtils.erstelleTestTarif();
      
      expect(tarif).toHaveProperty('id');
      expect(typeof tarif.id).toBe('number');
      expect(tarif.id).toBeGreaterThanOrEqual(0);
      expect(tarif.id).toBeLessThan(1000);
      
      expect(tarif.tarif_name).toMatch(/^Test-Tarif-\d+$/);
      expect(tarif.tarif_typ).toBe('fest');
      expect(tarif.vertragslaufzeit_monate).toBe(12);
      expect(tarif.min_verbrauch_kwh).toBe(500);
      expect(tarif.max_verbrauch_kwh).toBe(10000);
      expect(tarif.zielkunden_typ).toBe('haushalt');
      expect(tarif.abrechnungs_haeufigkeit).toBe('monatlich');
      expect(tarif.ist_aktiv).toBe(true);
      expect(tarif.erstellt_am).toBeInstanceOf(Date);
      expect(tarif.aktualisiert_am).toBeInstanceOf(Date);
    });

    test('erstelleTestTarif mit Überschreibungen', () => {
      const ueberschreibungen = {
        tarif_name: 'Öko-Tarif Premium',
        tarif_typ: 'dynamisch',
        vertragslaufzeit_monate: 24,
        ist_aktiv: false
      };
      
      const tarif = TestUtils.erstelleTestTarif(ueberschreibungen);
      
      expect(tarif.tarif_name).toBe('Öko-Tarif Premium');
      expect(tarif.tarif_typ).toBe('dynamisch');
      expect(tarif.vertragslaufzeit_monate).toBe(24);
      expect(tarif.ist_aktiv).toBe(false);
      
      // Standard-Werte sollten erhalten bleiben
      expect(tarif.min_verbrauch_kwh).toBe(500);
      expect(tarif.zielkunden_typ).toBe('haushalt');
    });

    test('erstelleTestTarif generiert eindeutige IDs', () => {
      const tarif1 = TestUtils.erstelleTestTarif();
      jest.advanceTimersByTime(10); // Kleine Verzögerung
      const tarif2 = TestUtils.erstelleTestTarif();
      jest.advanceTimersByTime(10); // Kleine Verzögerung
      const tarif3 = TestUtils.erstelleTestTarif();
      
      expect(tarif1.id).not.toBe(tarif2.id);
      expect(tarif2.id).not.toBe(tarif3.id);
      expect(tarif1.id).not.toBe(tarif3.id);
      
      // Tarif-Namen sollten Format haben aber können gleich sein wenn schnell generiert
      expect(tarif1.tarif_name).toMatch(/^Test-Tarif-\d+$/);
      expect(tarif2.tarif_name).toMatch(/^Test-Tarif-\d+$/);
      expect(tarif3.tarif_name).toMatch(/^Test-Tarif-\d+$/);
    });
  });

  describe('Test-Preise Erstellung', () => {
    test('erstelleTestPreise mit Standard-Daten', () => {
      const preise = TestUtils.erstelleTestPreise();
      
      expect(preise.plz).toBe('10115');
      expect(preise.stadt).toBe('Berlin');
      expect(preise.bezirk).toBe('Mitte');
      expect(preise.arbeitspreis_cent_pro_kwh).toBe(28.50);
      expect(preise.grundpreis_euro_pro_monat).toBe(9.90);
      expect(preise.netzentgelte_cent_pro_kwh).toBe(7.20);
      expect(preise.steuern_cent_pro_kwh).toBe(5.40);
      expect(preise.erneuerbare_umlage_cent_pro_kwh).toBe(3.72);
      expect(preise.gueltigkeits_datum).toBeInstanceOf(Date);
    });

    test('erstelleTestPreise mit Überschreibungen', () => {
      const ueberschreibungen = {
        plz: '80331',
        stadt: 'München',
        bezirk: 'Altstadt',
        arbeitspreis_cent_pro_kwh: 30.25,
        grundpreis_euro_pro_monat: 12.50
      };
      
      const preise = TestUtils.erstelleTestPreise(ueberschreibungen);
      
      expect(preise.plz).toBe('80331');
      expect(preise.stadt).toBe('München');
      expect(preise.bezirk).toBe('Altstadt');
      expect(preise.arbeitspreis_cent_pro_kwh).toBe(30.25);
      expect(preise.grundpreis_euro_pro_monat).toBe(12.50);
      
      // Standard-Werte sollten erhalten bleiben
      expect(preise.netzentgelte_cent_pro_kwh).toBe(7.20);
      expect(preise.steuern_cent_pro_kwh).toBe(5.40);
    });

    test('erstelleTestPreise mit numerischen Überschreibungen', () => {
      const preise = TestUtils.erstelleTestPreise({
        arbeitspreis_cent_pro_kwh: 0,
        grundpreis_euro_pro_monat: 0,
        netzentgelte_cent_pro_kwh: 0
      });
      
      expect(preise.arbeitspreis_cent_pro_kwh).toBe(0);
      expect(preise.grundpreis_euro_pro_monat).toBe(0);
      expect(preise.netzentgelte_cent_pro_kwh).toBe(0);
    });
  });

  describe('Test-PLZ Erstellung', () => {
    test('erstelleTestPlz mit Standard-Daten', () => {
      const plz = TestUtils.erstelleTestPlz();
      
      expect(plz.plz).toBe('10115');
      expect(plz.stadt).toBe('Berlin');
      expect(plz.bezirk).toBe('Mitte');
      expect(plz.bundesland).toBe('Berlin');
      expect(plz.netzbetreiber).toBe('Stromnetz Berlin');
      expect(plz.netzbetreiber_code).toBe('SNB');
      expect(plz.erstellt_am).toBeInstanceOf(Date);
      expect(plz.aktualisiert_am).toBeInstanceOf(Date);
    });

    test('erstelleTestPlz mit Überschreibungen', () => {
      const ueberschreibungen = {
        plz: '20095',
        stadt: 'Hamburg',
        bezirk: 'Hamburg-Altstadt',
        bundesland: 'Hamburg',
        netzbetreiber: 'Stromnetz Hamburg',
        netzbetreiber_code: 'SNH'
      };
      
      const plz = TestUtils.erstelleTestPlz(ueberschreibungen);
      
      expect(plz.plz).toBe('20095');
      expect(plz.stadt).toBe('Hamburg');
      expect(plz.bezirk).toBe('Hamburg-Altstadt');
      expect(plz.bundesland).toBe('Hamburg');
      expect(plz.netzbetreiber).toBe('Stromnetz Hamburg');
      expect(plz.netzbetreiber_code).toBe('SNH');
    });
  });

  describe('Test-Vertragsentwurf Erstellung', () => {
    test('erstelleTestVertragsentwurf mit Standard-Daten', () => {
      const entwurf = TestUtils.erstelleTestVertragsentwurf();
      
      expect(entwurf).toHaveProperty('entwurf_id');
      expect(entwurf.entwurf_id).toMatch(/^entwurf_\d+_[a-z0-9]{9}$/);
      expect(entwurf).toHaveProperty('kunden_id');
      expect(entwurf.kunden_id).toMatch(/^kunde_\d+$/);
      expect(entwurf).toHaveProperty('kampagne_id');
      expect(entwurf.kampagne_id).toMatch(/^kampagne_\d+$/);
      expect(entwurf.tarif_id).toBe(1);
      expect(entwurf.geschaetzter_jahresverbrauch).toBe(3500);
      expect(entwurf.vertragsbeginn).toBeInstanceOf(Date);
      expect(entwurf.status).toBe('entwurf');
      expect(entwurf.erstellt_am).toBeInstanceOf(Date);
      expect(entwurf.aktualisiert_am).toBeInstanceOf(Date);
      
      // Vertragsbeginn sollte in der Zukunft liegen
      expect(entwurf.vertragsbeginn.getTime()).toBeGreaterThan(Date.now());
    });

    test('erstelleTestVertragsentwurf mit Überschreibungen', () => {
      const zukunftsDatum = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 Tage
      const ueberschreibungen = {
        tarif_id: 5,
        geschaetzter_jahresverbrauch: 2800,
        vertragsbeginn: zukunftsDatum,
        status: 'genehmigt'
      };
      
      const entwurf = TestUtils.erstelleTestVertragsentwurf(ueberschreibungen);
      
      expect(entwurf.tarif_id).toBe(5);
      expect(entwurf.geschaetzter_jahresverbrauch).toBe(2800);
      expect(entwurf.vertragsbeginn).toBe(zukunftsDatum);
      expect(entwurf.status).toBe('genehmigt');
    });

    test('erstelleTestVertragsentwurf generiert eindeutige IDs', () => {
      const entwurf1 = TestUtils.erstelleTestVertragsentwurf();
      jest.advanceTimersByTime(10); // Kleine Verzögerung
      const entwurf2 = TestUtils.erstelleTestVertragsentwurf();
      jest.advanceTimersByTime(10); // Kleine Verzögerung
      const entwurf3 = TestUtils.erstelleTestVertragsentwurf();
      
      expect(entwurf1.entwurf_id).not.toBe(entwurf2.entwurf_id);
      expect(entwurf2.entwurf_id).not.toBe(entwurf3.entwurf_id);
      expect(entwurf1.entwurf_id).not.toBe(entwurf3.entwurf_id);
      
      // IDs sollten Format haben aber können gleich sein wenn schnell generiert
      expect(entwurf1.kunden_id).toMatch(/^kunde_\d+$/);
      expect(entwurf1.kampagne_id).toMatch(/^kampagne_\d+$/);
      expect(entwurf2.kunden_id).toMatch(/^kunde_\d+$/);
      expect(entwurf2.kampagne_id).toMatch(/^kampagne_\d+$/);
    });
  });

  describe('Mock-Datenbank Antworten', () => {
    test('mockDbAntwort mit Array-Daten', () => {
      const testDaten = [
        { id: 1, name: 'Test1' },
        { id: 2, name: 'Test2' },
        { id: 3, name: 'Test3' }
      ];
      
      const antwort = TestUtils.mockDbAntwort(testDaten);
      
      expect(antwort.rows).toEqual(testDaten);
      expect(antwort.rowCount).toBe(3);
      expect(antwort.command).toBe('SELECT');
      expect(Array.isArray(antwort.fields)).toBe(true);
    });

    test('mockDbAntwort mit Objekt-Daten', () => {
      const testDatum = { id: 1, name: 'Test' };
      
      const antwort = TestUtils.mockDbAntwort(testDatum);
      
      expect(antwort.rows).toEqual([testDatum]);
      expect(antwort.rowCount).toBe(1);
      expect(antwort.command).toBe('SELECT');
    });

    test('mockDbAntwort mit leeren Daten', () => {
      const antwort = TestUtils.mockDbAntwort();
      
      expect(antwort.rows).toEqual([]);
      expect(antwort.rowCount).toBe(0);
      expect(antwort.command).toBe('SELECT');
    });

    test('mockDbAntwort mit Custom RowCount', () => {
      const testDaten = [{ id: 1 }, { id: 2 }];
      const antwort = TestUtils.mockDbAntwort(testDaten, 5);
      
      expect(antwort.rows).toEqual(testDaten);
      expect(antwort.rowCount).toBe(5);
    });

    test('mockDbAntwort mit null RowCount', () => {
      const testDaten = [{ id: 1 }, { id: 2 }];
      const antwort = TestUtils.mockDbAntwort(testDaten, null);
      
      expect(antwort.rowCount).toBe(2); // Sollte auf Array-Länge zurückfallen
    });
  });

  describe('Hilfsfunktionen', () => {
    test('warte Funktion', async () => {
      jest.useRealTimers(); // Reale Timer für diese Tests
      const start = Date.now();
      await TestUtils.warte(50);
      const ende = Date.now();
      
      expect(ende - start).toBeGreaterThanOrEqual(45); // Etwas Toleranz
      expect(ende - start).toBeLessThan(200); // Großzügige Obergrenze
      jest.useFakeTimers(); // Zurück zu Fake-Timers
    });

    test('warte mit 0 Millisekunden', async () => {
      jest.useRealTimers(); // Reale Timer für diese Tests
      const start = Date.now();
      await TestUtils.warte(0);
      const ende = Date.now();
      
      expect(ende - start).toBeLessThan(50); // Mehr Toleranz für langsame Systeme
      jest.useFakeTimers(); // Zurück zu Fake-Timers
    });

    test('generiereTestEmail', () => {
      const email1 = TestUtils.generiereTestEmail();
      const email2 = TestUtils.generiereTestEmail();
      const email3 = TestUtils.generiereTestEmail();
      
      expect(email1).toMatch(/^test\.\d+\.[a-z0-9]{5}@example\.com$/);
      expect(email2).toMatch(/^test\.\d+\.[a-z0-9]{5}@example\.com$/);
      expect(email3).toMatch(/^test\.\d+\.[a-z0-9]{5}@example\.com$/);
      
      // Sollten eindeutig sein
      expect(email1).not.toBe(email2);
      expect(email2).not.toBe(email3);
      expect(email1).not.toBe(email3);
    });

    test('generiereTestPlz', () => {
      const plz1 = TestUtils.generiereTestPlz();
      const plz2 = TestUtils.generiereTestPlz();
      const plz3 = TestUtils.generiereTestPlz();
      
      expect(plz1).toMatch(/^[0-9]{5}$/);
      expect(plz2).toMatch(/^[0-9]{5}$/);
      expect(plz3).toMatch(/^[0-9]{5}$/);
      
      // PLZ sollten im gültigen Bereich sein
      expect(parseInt(plz1)).toBeGreaterThanOrEqual(10000);
      expect(parseInt(plz1)).toBeLessThanOrEqual(99999);
      expect(parseInt(plz2)).toBeGreaterThanOrEqual(10000);
      expect(parseInt(plz2)).toBeLessThanOrEqual(99999);
      expect(parseInt(plz3)).toBeGreaterThanOrEqual(10000);
      expect(parseInt(plz3)).toBeLessThanOrEqual(99999);
    });
  });

  describe('Datenbank-Bereinigung', () => {
    test('bereinigTestDaten mit Mock-Datenbank', async () => {
      const mockDb = {
        query: jest.fn().mockResolvedValue({ rowCount: 1 })
      };
      
      const tabellen = ['vertraege', 'kunden', 'tarife'];
      
      await TestUtils.bereinigTestDaten(mockDb, tabellen);
      
      expect(mockDb.query).toHaveBeenCalledTimes(3);
      expect(mockDb.query).toHaveBeenCalledWith("DELETE FROM tarife WHERE erstellt_am > NOW() - INTERVAL '1 hour'");
      expect(mockDb.query).toHaveBeenCalledWith("DELETE FROM kunden WHERE erstellt_am > NOW() - INTERVAL '1 hour'");
      expect(mockDb.query).toHaveBeenCalledWith("DELETE FROM vertraege WHERE erstellt_am > NOW() - INTERVAL '1 hour'");
    });

    test('bereinigTestDaten mit fehlgeschlagenen Queries', async () => {
      const mockDb = {
        query: jest.fn()
          .mockResolvedValueOnce({ rowCount: 1 })
          .mockRejectedValueOnce(new Error('Tabelle nicht gefunden'))
          .mockResolvedValueOnce({ rowCount: 0 })
      };
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const tabellen = ['vertraege', 'fehlerhafte_tabelle', 'kunden'];
      
      await TestUtils.bereinigTestDaten(mockDb, tabellen);
      
      expect(mockDb.query).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Warnung: Konnte Tabelle fehlerhafte_tabelle nicht bereinigen:',
        'Tabelle nicht gefunden'
      );
      
      consoleSpy.mockRestore();
    });

    test('bereinigTestDaten ohne Datenbank', async () => {
      // Sollte keine Fehler werfen
      await expect(TestUtils.bereinigTestDaten(null, ['test'])).resolves.toBeUndefined();
      await expect(TestUtils.bereinigTestDaten(undefined, ['test'])).resolves.toBeUndefined();
    });

    test('bereinigTestDaten ohne Tabellen', async () => {
      const mockDb = {
        query: jest.fn()
      };
      
      await TestUtils.bereinigTestDaten(mockDb, null);
      await TestUtils.bereinigTestDaten(mockDb, undefined);
      await TestUtils.bereinigTestDaten(mockDb, []);
      
      expect(mockDb.query).not.toHaveBeenCalled();
    });
  });

  describe('API-Response Validierung', () => {
    test('validiereApiResponse für erfolgreiche Response', () => {
      const response = {
        erfolg: true,
        nachricht: 'Erfolgreich verarbeitet',
        daten: { id: 1, name: 'Test' }
      };
      
      expect(() => {
        TestUtils.validiereApiResponse(response, true);
      }).not.toThrow();
    });

    test('validiereApiResponse für fehlerhafte Response', () => {
      const response = {
        erfolg: false,
        nachricht: 'Fehler aufgetreten',
        fehler: ['Validierungsfehler', 'Datenbankfehler']
      };
      
      expect(() => {
        TestUtils.validiereApiResponse(response, false);
      }).not.toThrow();
    });

    test('validiereApiResponse wirft bei fehlender erfolg Eigenschaft', () => {
      const response = {
        nachricht: 'Test'
      };
      
      expect(() => {
        TestUtils.validiereApiResponse(response);
      }).toThrow();
    });

    test('validiereApiResponse wirft bei fehlender nachricht Eigenschaft', () => {
      const response = {
        erfolg: true
      };
      
      expect(() => {
        TestUtils.validiereApiResponse(response);
      }).toThrow();
    });

    test('validiereApiResponse mit falscher nachricht Type', () => {
      const response = {
        erfolg: true,
        nachricht: 123
      };
      
      expect(() => {
        TestUtils.validiereApiResponse(response);
      }).toThrow();
    });

    test('validiereApiResponse ohne daten bei erfolgreicher Response', () => {
      const response = {
        erfolg: true,
        nachricht: 'Erfolgreich'
      };
      
      expect(() => {
        TestUtils.validiereApiResponse(response, true);
      }).not.toThrow();
    });

    test('validiereApiResponse ohne fehler bei fehlgeschlagener Response', () => {
      const response = {
        erfolg: false,
        nachricht: 'Fehler'
      };
      
      expect(() => {
        TestUtils.validiereApiResponse(response, false);
      }).not.toThrow();
    });

    test('validiereApiResponse mit nicht-Array fehler', () => {
      const response = {
        erfolg: false,
        nachricht: 'Fehler',
        fehler: 'Einzelfehler'
      };
      
      expect(() => {
        TestUtils.validiereApiResponse(response, false);
      }).toThrow();
    });
  });

  describe('Edge Cases und Fehlerbehandlung', () => {
    test('alle Funktionen handhaben undefined gracefully', () => {
      expect(() => TestUtils.erstelleTestKunde(undefined)).not.toThrow();
      expect(() => TestUtils.erstelleTestTarif(undefined)).not.toThrow();
      expect(() => TestUtils.erstelleTestPreise(undefined)).not.toThrow();
      expect(() => TestUtils.erstelleTestPlz(undefined)).not.toThrow();
      expect(() => TestUtils.erstelleTestVertragsentwurf(undefined)).not.toThrow();
    });

    test('alle Funktionen handhaben null gracefully', () => {
      expect(() => TestUtils.erstelleTestKunde(null)).not.toThrow();
      expect(() => TestUtils.erstelleTestTarif(null)).not.toThrow();
      expect(() => TestUtils.erstelleTestPreise(null)).not.toThrow();
      expect(() => TestUtils.erstelleTestPlz(null)).not.toThrow();
      expect(() => TestUtils.erstelleTestVertragsentwurf(null)).not.toThrow();
    });

    test('Funktionen mit extremen Werten', () => {
      const extremeValues = {
        id: Number.MAX_SAFE_INTEGER,
        negative_id: -1,
        zero_id: 0,
        large_string: 'x'.repeat(10000),
        empty_string: '',
        special_chars: '!@#$%^&*()_+{}[]|\\:";\'<>?,./',
        unicode: '🚀🎉💡🔥⚡🌟💻🎯',
        sql_injection: "'; DROP TABLE users; --",
        xss: '<script>alert("xss")</script>'
      };
      
      expect(() => TestUtils.erstelleTestKunde(extremeValues)).not.toThrow();
      expect(() => TestUtils.erstelleTestTarif(extremeValues)).not.toThrow();
      expect(() => TestUtils.erstelleTestPreise(extremeValues)).not.toThrow();
      expect(() => TestUtils.erstelleTestPlz(extremeValues)).not.toThrow();
      expect(() => TestUtils.erstelleTestVertragsentwurf(extremeValues)).not.toThrow();
    });
  });

  describe('Performance und Memory Tests', () => {
    test('Masse-Generierung von Test-Daten', () => {
      const anzahl = 1000;
      const start = Date.now();
      
      const kunden = [];
      for (let i = 0; i < anzahl; i++) {
        kunden.push(TestUtils.erstelleTestKunde({ index: i }));
      }
      
      const dauer = Date.now() - start;
      
      expect(kunden).toHaveLength(anzahl);
      expect(dauer).toBeLessThan(5000); // Sollte in unter 5 Sekunden abgeschlossen sein
      
      // Prüfe Eindeutigkeit
      const kundenIds = kunden.map(k => k.kunden_id);
      const eindeutigeIds = new Set(kundenIds);
      expect(eindeutigeIds.size).toBe(anzahl);
    });

    test('Memory-Usage bei großen Datenmengen', () => {
      const startMemory = process.memoryUsage();
      
      const daten = [];
      for (let i = 0; i < 10000; i++) {
        daten.push({
          kunde: TestUtils.erstelleTestKunde(),
          tarif: TestUtils.erstelleTestTarif(),
          preise: TestUtils.erstelleTestPreise()
        });
      }
      
      const endMemory = process.memoryUsage();
      const memoryDiff = endMemory.heapUsed - startMemory.heapUsed;
      
      expect(daten).toHaveLength(10000);
      expect(memoryDiff).toBeLessThan(100 * 1024 * 1024); // Unter 100MB
    });
  });
});