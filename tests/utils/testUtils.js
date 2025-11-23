const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * Test-Hilfsfunktionen für EVU Backend Tests
 */
class TestUtils {
  
  /**
   * Erstellt einen Test-JWT-Token
   * @param {Object} payload - Token-Payload
   * @returns {string} JWT-Token
   */
  static erstelleJwtToken(payload = {}) {
    const standardPayload = {
      id: payload.id || uuidv4(),
      kunden_id: payload.kunden_id || `kunde_${Date.now()}`,
      email: payload.email || 'test@example.com',
      ...payload
    };
    
    return jwt.sign(standardPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });
  }
  
  /**
   * Hash ein Passwort für Tests
   * @param {string} passwort - Klartext-Passwort
   * @returns {Promise<string>} Gehashtes Passwort
   */
  static async hashePasswort(passwort) {
    return await bcrypt.hash(passwort, 12);
  }
  
  /**
   * Erstellt Test-Kunde-Daten
   * @param {Object} ueberschreibungen - Felder zum Überschreiben
   * @returns {Object} Test-Kunde
   */
  static erstelleTestKunde(ueberschreibungen = {}) {
    return {
      kunden_id: `kunde_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: `test.${Date.now()}@example.com`,
      passwort_hash: '$2a$12$test.hash.for.testing.only',
      vorname: 'Max',
      nachname: 'Mustermann',
      telefon: '+49 30 12345678',
      strasse: 'Teststraße',
      hausnummer: '123',
      plz: '10115',
      stadt: 'Berlin',
      bezirk: 'Mitte',
      land: 'Deutschland',
      bevorzugte_sprache: 'de',
      marketing_einverstaendnis: false,
      newsletter_einverstaendnis: false,
      ist_aktiv: true,
      ist_verifiziert: true,
      erstellt_am: new Date(),
      aktualisiert_am: new Date(),
      ...ueberschreibungen
    };
  }
  
  /**
   * Erstellt Test-Tarif-Daten
   * @param {Object} ueberschreibungen - Felder zum Überschreiben
   * @returns {Object} Test-Tarif
   */
  static erstelleTestTarif(ueberschreibungen = {}) {
    return {
      id: Math.floor(Math.random() * 1000),
      tarif_name: `Test-Tarif-${Date.now()}`,
      tarif_typ: 'fest',
      vertragslaufzeit_monate: 12,
      min_verbrauch_kwh: 500,
      max_verbrauch_kwh: 10000,
      zielkunden_typ: 'haushalt',
      abrechnungs_haeufigkeit: 'monatlich',
      ist_aktiv: true,
      erstellt_am: new Date(),
      aktualisiert_am: new Date(),
      ...ueberschreibungen
    };
  }
  
  /**
   * Erstellt Test-Preisdaten
   * @param {Object} ueberschreibungen - Felder zum Überschreiben
   * @returns {Object} Test-Preise
   */
  static erstelleTestPreise(ueberschreibungen = {}) {
    return {
      plz: '10115',
      stadt: 'Berlin',
      bezirk: 'Mitte',
      arbeitspreis_cent_pro_kwh: 28.50,
      grundpreis_euro_pro_monat: 9.90,
      netzentgelte_cent_pro_kwh: 7.20,
      steuern_cent_pro_kwh: 5.40,
      erneuerbare_umlage_cent_pro_kwh: 3.72,
      gueltigkeits_datum: new Date(),
      ...ueberschreibungen
    };
  }
  
  /**
   * Erstellt Test-PLZ-Daten
   * @param {Object} ueberschreibungen - Felder zum Überschreiben
   * @returns {Object} Test-PLZ
   */
  static erstelleTestPlz(ueberschreibungen = {}) {
    return {
      plz: '10115',
      stadt: 'Berlin',
      bezirk: 'Mitte',
      bundesland: 'Berlin',
      netzbetreiber: 'Stromnetz Berlin',
      netzbetreiber_code: 'SNB',
      erstellt_am: new Date(),
      aktualisiert_am: new Date(),
      ...ueberschreibungen
    };
  }
  
  /**
   * Erstellt Test-Vertragsentwurf
   * @param {Object} ueberschreibungen - Felder zum Überschreiben
   * @returns {Object} Test-Vertragsentwurf
   */
  static erstelleTestVertragsentwurf(ueberschreibungen = {}) {
    return {
      entwurf_id: `entwurf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      kunden_id: `kunde_${Date.now()}`,
      kampagne_id: `kampagne_${Date.now()}`,
      tarif_id: 1,
      geschaetzter_jahresverbrauch: 3500,
      vertragsbeginn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Tage in der Zukunft
      status: 'entwurf',
      erstellt_am: new Date(),
      aktualisiert_am: new Date(),
      ...ueberschreibungen
    };
  }
  
  /**
   * Simuliert eine Datenbank-Antwort
   * @param {Array|Object} daten - Rückgabedaten
   * @param {number} anzahlZeilen - Anzahl betroffener Zeilen
   * @returns {Object} Mock-DB-Response
   */
  static mockDbAntwort(daten = [], anzahlZeilen = null) {
    const rows = Array.isArray(daten) ? daten : [daten];
    return {
      rows,
      rowCount: anzahlZeilen !== null ? anzahlZeilen : rows.length,
      command: 'SELECT',
      fields: []
    };
  }
  
  /**
   * Wartet eine bestimmte Zeit (für asynchrone Tests)
   * @param {number} ms - Millisekunden zu warten
   * @returns {Promise} Promise das nach der Zeit resolved
   */
  static async warte(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Generiert zufällige Test-E-Mail
   * @returns {string} Test-E-Mail-Adresse
   */
  static generiereTestEmail() {
    return `test.${Date.now()}.${Math.random().toString(36).substr(2, 5)}@example.com`;
  }
  
  /**
   * Generiert zufällige PLZ
   * @returns {string} 5-stellige PLZ
   */
  static generiereTestPlz() {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }
  
  /**
   * Bereinigt Test-Daten
   * @param {Object} datenbank - Datenbank-Instance
   * @param {Array} tabellen - Zu bereinigende Tabellen
   */
  static async bereinigTestDaten(datenbank, tabellen = []) {
    if (!datenbank || !Array.isArray(tabellen)) return;
    
    for (const tabelle of tabellen.reverse()) { // Reverse wegen Foreign Keys
      try {
        await datenbank.query(`DELETE FROM ${tabelle} WHERE erstellt_am > NOW() - INTERVAL '1 hour'`);
      } catch (error) {
        console.warn(`Warnung: Konnte Tabelle ${tabelle} nicht bereinigen:`, error.message);
      }
    }
  }
  
  /**
   * Validiert API-Response-Format
   * @param {Object} response - API-Response
   * @param {boolean} sollErfolgreich - Ob Response erfolgreich sein soll
   */
  static validiereApiResponse(response, sollErfolgreich = true) {
    expect(response).toHaveProperty('erfolg');
    expect(response.erfolg).toBe(sollErfolgreich);
    expect(response).toHaveProperty('nachricht');
    expect(typeof response.nachricht).toBe('string');
    
    if (sollErfolgreich && response.daten) {
      expect(response).toHaveProperty('daten');
    }
    
    if (!sollErfolgreich && response.fehler) {
      expect(response).toHaveProperty('fehler');
      expect(Array.isArray(response.fehler)).toBe(true);
    }
  }
}

module.exports = TestUtils;