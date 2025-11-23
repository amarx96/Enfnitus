const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Import dummy data generators
const DummyDataGenerator = require('./data/dummyDataGenerator');
const mockDatabase = require('./data/mockDatabase');

const app = express();
const PORT = process.env.TEST_API_PORT || 3001;

// Test JWT Secret
const JWT_SECRET = 'test-dummy-api-secret-2024';

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Request Logging Middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - Dummy API Request`);
  next();
});

// Response Helper
const sendResponse = (res, success = true, data = null, message = 'Erfolgreich', status = 200) => {
  res.status(status).json({
    erfolg: success,
    nachricht: message,
    daten: data,
    zeitstempel: new Date().toISOString(),
    test_api: true // Marker for test environment
  });
};

// Error Helper
const sendError = (res, message = 'Serverfehler', status = 500, errors = []) => {
  res.status(status).json({
    erfolg: false,
    nachricht: message,
    fehler: errors,
    zeitstempel: new Date().toISOString(),
    test_api: true
  });
};

// Authentication Middleware for protected routes
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return sendError(res, 'Nicht berechtigt, auf diese Route zuzugreifen', 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return sendError(res, 'Ungültiger oder abgelaufener Token', 401);
  }
};

// ================================
// DUMMY API ROUTES
// ================================

// Health Check
app.get('/health', (req, res) => {
  sendResponse(res, true, {
    status: 'healthy',
    service: 'EVU Backend Dummy API',
    uptime: process.uptime(),
    environment: 'test',
    version: '1.0.0'
  }, 'Dummy API läuft erfolgreich');
});

// API Information
app.get('/info', (req, res) => {
  sendResponse(res, true, {
    name: 'EVU Backend Dummy API',
    description: 'Test environment with mock data for EVU backend services',
    version: '1.0.0',
    endpoints: {
      auth: '/api/v1/auth/*',
      customers: '/api/v1/kunden/*',
      pricing: '/api/v1/preise/*',
      contracting: '/api/v1/vertraege/*',
      database: '/api/v1/db/*'
    },
    features: [
      'Realistic German EVU data',
      'JWT Authentication simulation',
      'PLZ-based pricing',
      'Customer lifecycle management',
      'Contract workflow simulation'
    ]
  }, 'API-Informationen');
});

// Root Welcome Page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>EVU Backend Dummy API</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; background: #f5f7fa; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; margin-bottom: 20px; }
        .status { background: #d4edda; color: #155724; padding: 12px; border-radius: 6px; margin-bottom: 20px; }
        .endpoint { background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 10px 0; border-left: 4px solid #007bff; }
        .method { font-weight: bold; color: #007bff; }
        .url { font-family: monospace; background: #e9ecef; padding: 2px 6px; border-radius: 3px; }
        ul { list-style-type: none; padding: 0; }
        li { margin: 8px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 EVU Backend Dummy API</h1>
        <div class="status">✅ Server läuft erfolgreich auf Port 3001</div>
        
        <h2>📋 Verfügbare Endpoints</h2>
        <div class="endpoint">
          <div class="method">GET</div>
          <div class="url">/health</div>
          <div>Server-Gesundheitsstatus</div>
        </div>
        <div class="endpoint">
          <div class="method">GET</div>
          <div class="url">/info</div>
          <div>API-Informationen und verfügbare Endpoints</div>
        </div>
        
        <h3>🔐 Authentifizierung</h3>
        <div class="endpoint">
          <div class="method">POST</div>
          <div class="url">/api/v1/auth/register</div>
          <div>Benutzerregistrierung</div>
        </div>
        <div class="endpoint">
          <div class="method">POST</div>
          <div class="url">/api/v1/auth/login</div>
          <div>Benutzeranmeldung</div>
        </div>
        
        <h3>👥 Kunden</h3>
        <div class="endpoint">
          <div class="method">GET</div>
          <div class="url">/api/v1/kunden/profil</div>
          <div>Kundenprofil abrufen</div>
        </div>
        <div class="endpoint">
          <div class="method">GET</div>
          <div class="url">/api/v1/kunden/energie-profil</div>
          <div>Energieprofil des Kunden</div>
        </div>
        
        <h3>💰 Preise</h3>
        <div class="endpoint">
          <div class="method">GET</div>
          <div class="url">/api/v1/preise/tarife</div>
          <div>Verfügbare Tarife</div>
        </div>
        <div class="endpoint">
          <div class="method">POST</div>
          <div class="url">/api/v1/preise/berechnen</div>
          <div>Preisberechnung nach PLZ</div>
        </div>
        
        <h3>📄 Verträge</h3>
        <div class="endpoint">
          <div class="method">GET</div>
          <div class="url">/api/v1/vertraege</div>
          <div>Kundenverträge abrufen</div>
        </div>
        <div class="endpoint">
          <div class="method">POST</div>
          <div class="url">/api/v1/vertraege/entwurf</div>
          <div>Vertragsentwurf erstellen</div>
        </div>
        
        <div class="footer">
          <strong>Environment:</strong> TEST<br>
          <strong>Version:</strong> 1.0.0<br>
          <strong>Daten:</strong> 50 Kunden, 12 Tarife, 60+ Preise, 38 Verträge<br>
          <strong>Features:</strong> Deutsche EVU-Daten, JWT-Auth, PLZ-basierte Preise
        </div>
      </div>
    </body>
    </html>
  `);
});

// ================================
// AUTHENTICATION ENDPOINTS
// ================================

// Register new customer
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, passwort, vorname, nachname, telefon, plz } = req.body;

    // Basic validation
    if (!email || !passwort || !vorname || !nachname) {
      return sendError(res, 'Validierungsfehler', 400, [
        { feld: 'email', nachricht: 'E-Mail ist erforderlich' },
        { feld: 'passwort', nachricht: 'Passwort ist erforderlich' }
      ]);
    }

    // Check if user already exists
    const existingUser = mockDatabase.findCustomerByEmail(email);
    if (existingUser) {
      return sendError(res, 'E-Mail-Adresse bereits registriert', 409, [
        { feld: 'email', nachricht: 'Diese E-Mail-Adresse ist bereits vergeben' }
      ]);
    }

    // Create new customer
    const hashedPassword = await bcrypt.hash(passwort, 12);
    const newCustomer = DummyDataGenerator.generateCustomer({
      email,
      passwort_hash: hashedPassword,
      vorname,
      nachname,
      telefon,
      plz: plz || '10115'
    });

    // Save to mock database
    mockDatabase.createCustomer(newCustomer);

    // Generate JWT token
    const token = jwt.sign(
      { 
        kunden_id: newCustomer.kunden_id,
        email: newCustomer.email,
        vorname: newCustomer.vorname,
        nachname: newCustomer.nachname
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    sendResponse(res, true, {
      kunde: {
        kunden_id: newCustomer.kunden_id,
        email: newCustomer.email,
        vorname: newCustomer.vorname,
        nachname: newCustomer.nachname,
        ist_verifiziert: newCustomer.ist_verifiziert
      },
      token,
      token_expires_in: '24h'
    }, 'Registrierung erfolgreich', 201);

  } catch (error) {
    console.error('Registration error:', error);
    sendError(res, 'Fehler bei der Registrierung', 500);
  }
});

// Login customer
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, passwort } = req.body;

    if (!email || !passwort) {
      return sendError(res, 'E-Mail und Passwort sind erforderlich', 400);
    }

    // Find customer
    const customer = mockDatabase.findCustomerByEmail(email);
    if (!customer) {
      return sendError(res, 'Ungültige Anmeldedaten', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(passwort, customer.passwort_hash);
    if (!isValidPassword) {
      return sendError(res, 'Ungültige Anmeldedaten', 401);
    }

    // Check if account is active
    if (!customer.ist_aktiv) {
      return sendError(res, 'Konto ist deaktiviert', 403);
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        kunden_id: customer.kunden_id,
        email: customer.email,
        vorname: customer.vorname,
        nachname: customer.nachname
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    mockDatabase.updateCustomerLastLogin(customer.kunden_id);

    sendResponse(res, true, {
      kunde: {
        kunden_id: customer.kunden_id,
        email: customer.email,
        vorname: customer.vorname,
        nachname: customer.nachname,
        ist_verifiziert: customer.ist_verifiziert
      },
      token,
      token_expires_in: '24h'
    }, 'Anmeldung erfolgreich');

  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Fehler bei der Anmeldung', 500);
  }
});

// Verify token
app.get('/api/v1/auth/verify', authenticateToken, (req, res) => {
  const customer = mockDatabase.findCustomerById(req.user.kunden_id);
  
  if (!customer) {
    return sendError(res, 'Kunde nicht gefunden', 404);
  }

  sendResponse(res, true, {
    kunden_id: customer.kunden_id,
    email: customer.email,
    vorname: customer.vorname,
    nachname: customer.nachname,
    ist_verifiziert: customer.ist_verifiziert,
    ist_aktiv: customer.ist_aktiv
  }, 'Token ist gültig');
});

// ================================
// PRICING SERVICE ENDPOINTS
// ================================

// Calculate pricing for PLZ
app.post('/api/v1/preise/berechnen', (req, res) => {
  try {
    const { plz, jahresverbrauch, haushaltsgröße, tariftyp } = req.body;

    // Validate PLZ
    if (!plz || !/^[0-9]{5}$/.test(plz)) {
      return sendError(res, 'Validierungsfehler', 400, [
        { feld: 'plz', nachricht: 'PLZ muss eine 5-stellige Zahl sein' }
      ]);
    }

    // Check if PLZ is available
    const plzData = mockDatabase.findPlzData(plz);
    if (!plzData) {
      return sendError(res, 'PLZ nicht gefunden', 404, [
        { feld: 'plz', nachricht: 'Diese PLZ ist in unserem System nicht hinterlegt' }
      ]);
    }

    if (!plzData.verfuegbar) {
      return sendError(res, 'PLZ nicht verfügbar', 422, [
        { feld: 'plz', nachricht: plzData.grund || 'Diese PLZ ist derzeit nicht verfügbar' }
      ]);
    }

    // Estimate consumption if not provided
    let estimatedConsumption = jahresverbrauch;
    if (!estimatedConsumption && haushaltsgröße) {
      const consumptionByHousehold = {
        1: 2000,
        2: 2800,
        3: 3500,
        4: 4200,
        5: 5000,
        6: 5800
      };
      estimatedConsumption = consumptionByHousehold[haushaltsgröße] || 3500;
    } else if (!estimatedConsumption) {
      estimatedConsumption = 3500; // Default consumption
    }

    // Validate consumption
    if (estimatedConsumption < 500 || estimatedConsumption > 50000) {
      return sendError(res, 'Validierungsfehler', 400, [
        { feld: 'jahresverbrauch', nachricht: 'Jahresverbrauch muss zwischen 500 und 50.000 kWh liegen' }
      ]);
    }

    // Get available tariffs
    let tariffs = mockDatabase.findActiveTariffs();
    
    // Filter by tariff type if specified
    if (tariftyp) {
      tariffs = tariffs.filter(tariff => tariff.tarif_typ === tariftyp);
    }

    // Calculate prices for each tariff
    const calculatedTariffs = tariffs.map(tariff => {
      const priceData = mockDatabase.findPricesByPlz(plz)
        .find(price => price.tarif_id === tariff.id);

      if (!priceData) {
        return null;
      }

      // Calculate annual costs
      const arbeitskosten = estimatedConsumption * (priceData.arbeitspreis_cent_pro_kwh / 100);
      const grundkosten = 12 * priceData.grundpreis_euro_pro_monat;
      const netzkosten = estimatedConsumption * (priceData.netzentgelt_cent_pro_kwh / 100);
      const steuernUmlagen = estimatedConsumption * (
        (priceData.stromsteuer_cent_pro_kwh || 2.05) +
        (priceData.erneuerbare_umlage_cent_pro_kwh || 3.7) +
        (priceData.konzessionsabgabe_cent_pro_kwh || 1.66)
      ) / 100;

      const nettokosten = arbeitskosten + grundkosten + netzkosten + steuernUmlagen;
      const mehrwertsteuer = nettokosten * (priceData.mehrwertsteuer_prozent / 100);
      const bruttokosten = nettokosten + mehrwertsteuer;

      // Apply discounts
      let finalCosts = bruttokosten;
      let discounts = [];

      if (tariff.neukundenrabatt_prozent > 0) {
        const discount = bruttokosten * (tariff.neukundenrabatt_prozent / 100);
        finalCosts -= discount;
        discounts.push({
          typ: 'neukunde',
          prozent: tariff.neukundenrabatt_prozent,
          betrag: +discount.toFixed(2),
          beschreibung: 'Neukundenrabatt für das erste Jahr'
        });
      }

      if (tariff.fruhbucherrabatt_prozent > 0) {
        const discount = bruttokosten * (tariff.fruhbucherrabatt_prozent / 100);
        finalCosts -= discount;
        discounts.push({
          typ: 'fruhbucher',
          prozent: tariff.fruhbucherrabatt_prozent,
          betrag: +discount.toFixed(2),
          beschreibung: 'Frühbucherrabatt bei Online-Abschluss'
        });
      }

      return {
        tarif: {
          id: tariff.id,
          name: tariff.tarif_name,
          typ: tariff.tarif_typ,
          beschreibung: tariff.beschreibung,
          mindestlaufzeit: tariff.mindestvertragslaufzeit_monate,
          kuendigungsfrist: tariff.kuendigungsfrist_monate,
          preisgarantie: tariff.preisgarantie_monate,
          oeko_zertifikat: tariff.oeko_zertifikat,
          co2_neutral: tariff.co2_neutral
        },
        kosten: {
          arbeitskosten: +arbeitskosten.toFixed(2),
          grundkosten: +grundkosten.toFixed(2),
          netzkosten: +netzkosten.toFixed(2),
          steuern_umlagen: +steuernUmlagen.toFixed(2),
          mehrwertsteuer: +mehrwertsteuer.toFixed(2),
          brutto_jahreskosten: +bruttokosten.toFixed(2),
          finale_jahreskosten: +finalCosts.toFixed(2),
          monatliche_abschlagszahlung: +(finalCosts / 12).toFixed(2),
          cent_pro_kwh_effektiv: +((finalCosts / estimatedConsumption) * 100).toFixed(2)
        },
        preisdetails: {
          arbeitspreis_cent_pro_kwh: priceData.arbeitspreis_cent_pro_kwh,
          grundpreis_euro_pro_monat: priceData.grundpreis_euro_pro_monat,
          netzentgelt_cent_pro_kwh: priceData.netzentgelt_cent_pro_kwh,
          stromsteuer_cent_pro_kwh: priceData.stromsteuer_cent_pro_kwh || 2.05,
          erneuerbare_umlage_cent_pro_kwh: priceData.erneuerbare_umlage_cent_pro_kwh || 3.7,
          mehrwertsteuer_prozent: priceData.mehrwertsteuer_prozent
        },
        rabatte: discounts,
        gueltig_bis: priceData.gueltig_bis
      };
    }).filter(Boolean);

    // Sort by final costs
    calculatedTariffs.sort((a, b) => a.kosten.finale_jahreskosten - b.kosten.finale_jahreskosten);

    sendResponse(res, true, {
      standort: {
        plz: plz,
        stadt: plzData.stadt,
        bezirk: plzData.bezirk,
        bundesland: plzData.bundesland,
        netzbetreiber: plzData.netzbetreiber
      },
      verbrauchsdaten: {
        jahresverbrauch: jahresverbrauch || null,
        haushaltsgröße: haushaltsgröße || null,
        geschaetzterVerbrauch: estimatedConsumption
      },
      tarife: calculatedTariffs,
      anzahl_gefunden: calculatedTariffs.length,
      berechnet_am: new Date().toISOString()
    }, 'Preisberechnung erfolgreich durchgeführt');

  } catch (error) {
    console.error('Pricing calculation error:', error);
    sendError(res, 'Fehler bei der Preisberechnung', 500);
  }
});

// Get all active tariffs
app.get('/api/v1/preise/tarife', (req, res) => {
  try {
    const { typ, oeko, sortierung } = req.query;
    
    let tariffs = mockDatabase.findActiveTariffs();

    // Filter by type
    if (typ) {
      tariffs = tariffs.filter(tariff => tariff.tarif_typ === typ);
    }

    // Filter by eco-friendly
    if (oeko === 'true') {
      tariffs = tariffs.filter(tariff => tariff.oeko_zertifikat || tariff.co2_neutral);
    }

    // Sort tariffs
    if (sortierung === 'preis') {
      // This would require price calculation - simplified for demo
      tariffs.sort((a, b) => a.arbeitspreis_cent_pro_kwh - b.arbeitspreis_cent_pro_kwh);
    } else if (sortierung === 'name') {
      tariffs.sort((a, b) => a.tarif_name.localeCompare(b.tarif_name));
    } else {
      // Default: newest first
      tariffs.sort((a, b) => new Date(b.erstellt_am) - new Date(a.erstellt_am));
    }

    sendResponse(res, true, {
      tarife: tariffs.map(tariff => ({
        id: tariff.id,
        name: tariff.tarif_name,
        typ: tariff.tarif_typ,
        beschreibung: tariff.beschreibung,
        arbeitspreis_cent_pro_kwh: tariff.arbeitspreis_cent_pro_kwh,
        grundpreis_euro_pro_monat: tariff.grundpreis_euro_pro_monat,
        mindestlaufzeit: tariff.mindestvertragslaufzeit_monate,
        kuendigungsfrist: tariff.kuendigungsfrist_monate,
        preisgarantie: tariff.preisgarantie_monate,
        oeko_zertifikat: tariff.oeko_zertifikat,
        co2_neutral: tariff.co2_neutral,
        neukundenrabatt: tariff.neukundenrabatt_prozent,
        fruhbucherrabatt: tariff.fruhbucherrabatt_prozent
      })),
      anzahl: tariffs.length
    }, 'Tarife erfolgreich abgerufen');

  } catch (error) {
    console.error('Tariff retrieval error:', error);
    sendError(res, 'Fehler beim Abrufen der Tarife', 500);
  }
});

// Get location information for PLZ
app.get('/api/v1/preise/standorte/:plz', (req, res) => {
  try {
    const { plz } = req.params;

    if (!plz || !/^[0-9]{5}$/.test(plz)) {
      return sendError(res, 'Ungültige PLZ', 400, [
        { feld: 'plz', nachricht: 'PLZ muss eine 5-stellige Zahl sein' }
      ]);
    }

    const plzData = mockDatabase.findPlzData(plz);
    if (!plzData) {
      return sendError(res, 'PLZ nicht gefunden', 404);
    }

    sendResponse(res, true, {
      plz: plzData.plz,
      stadt: plzData.stadt,
      bezirk: plzData.bezirk,
      bundesland: plzData.bundesland,
      verfuegbar: plzData.verfuegbar,
      netzbetreiber: plzData.netzbetreiber,
      netzbetreiber_code: plzData.netzbetreiber_code,
      grund: plzData.grund || null,
      region: DummyDataGenerator.getRegionByPlz(plz)
    }, 'Standortinformationen erfolgreich abgerufen');

  } catch (error) {
    console.error('Location retrieval error:', error);
    sendError(res, 'Fehler beim Abrufen der Standortinformationen', 500);
  }
});

// ================================
// CUSTOMER MANAGEMENT ENDPOINTS (EXTENDED)
// ================================

// Get customer energy profile
app.get('/api/v1/kunden/energie-profil', authenticateToken, (req, res) => {
  try {
    const customer = mockDatabase.findCustomerById(req.user.kunden_id);
    
    if (!customer) {
      return sendError(res, 'Kunde nicht gefunden', 404);
    }

    sendResponse(res, true, {
      jahresverbrauch: customer.jahresverbrauch,
      haushaltsgröße: customer.haushaltsgröße,
      kunde_typ: customer.kunde_typ,
      geschaetzter_verbrauch: customer.jahresverbrauch,
      verbrauchsklasse: customer.jahresverbrauch < 2000 ? 'niedrig' : 
                       customer.jahresverbrauch < 4000 ? 'mittel' : 'hoch',
      empfohlene_tarife: ['gruen', 'fest'], // Simplified recommendation
      letzte_aktualisierung: customer.aktualisiert_am
    }, 'Energieprofil erfolgreich abgerufen');

  } catch (error) {
    console.error('Energy profile error:', error);
    sendError(res, 'Fehler beim Abrufen des Energieprofils', 500);
  }
});

// Update customer energy profile
app.put('/api/v1/kunden/energie-profil', authenticateToken, (req, res) => {
  try {
    const { jahresverbrauch, haushaltsgröße } = req.body;

    // Validation
    if (jahresverbrauch && (jahresverbrauch < 500 || jahresverbrauch > 50000)) {
      return sendError(res, 'Validierungsfehler', 400, [
        { feld: 'jahresverbrauch', nachricht: 'Jahresverbrauch muss zwischen 500 und 50.000 kWh liegen' }
      ]);
    }

    if (haushaltsgröße && (haushaltsgröße < 1 || haushaltsgröße > 20)) {
      return sendError(res, 'Validierungsfehler', 400, [
        { feld: 'haushaltsgröße', nachricht: 'Haushaltsgröße muss zwischen 1 und 20 Personen liegen' }
      ]);
    }

    const updates = {};
    if (jahresverbrauch) updates.jahresverbrauch = jahresverbrauch;
    if (haushaltsgröße) updates.haushaltsgröße = haushaltsgröße;

    const updatedCustomer = mockDatabase.updateCustomer(req.user.kunden_id, updates);

    sendResponse(res, true, {
      jahresverbrauch: updatedCustomer.jahresverbrauch,
      haushaltsgröße: updatedCustomer.haushaltsgröße,
      letzte_aktualisierung: updatedCustomer.aktualisiert_am
    }, 'Energieprofil erfolgreich aktualisiert');

  } catch (error) {
    console.error('Energy profile update error:', error);
    sendError(res, 'Fehler bei der Aktualisierung des Energieprofils', 500);
  }
});

// Get customer consumption history
app.get('/api/v1/kunden/verbrauchshistorie', authenticateToken, (req, res) => {
  try {
    const { von, bis, limit = 12 } = req.query;
    
    let startDate = null;
    let endDate = null;

    if (von) {
      startDate = new Date(von);
      if (isNaN(startDate.getTime())) {
        return sendError(res, 'Ungültiges Startdatum', 400);
      }
    }

    if (bis) {
      endDate = new Date(bis);
      if (isNaN(endDate.getTime())) {
        return sendError(res, 'Ungültiges Enddatum', 400);
      }
    }

    const consumptionHistory = mockDatabase.findConsumptionByCustomerId(
      req.user.kunden_id, 
      startDate, 
      endDate
    );

    // Sort by date (newest first) and apply limit
    const sortedHistory = consumptionHistory
      .sort((a, b) => new Date(b.datum) - new Date(a.datum))
      .slice(0, parseInt(limit));

    // Calculate statistics
    const totalConsumption = sortedHistory.reduce((sum, entry) => sum + entry.verbrauch_kwh, 0);
    const averageConsumption = sortedHistory.length > 0 ? totalConsumption / sortedHistory.length : 0;
    const totalCosts = sortedHistory.reduce((sum, entry) => sum + entry.kosten_euro, 0);

    sendResponse(res, true, {
      verbrauchsdaten: sortedHistory.map(entry => ({
        datum: entry.datum,
        verbrauch_kwh: entry.verbrauch_kwh,
        kosten_euro: +entry.kosten_euro.toFixed(2),
        ablesungstyp: entry.ablesungstyp,
        temperatur_durchschnitt: entry.temperatur_durchschnitt,
        heizgradtage: entry.heizgradtage
      })),
      statistiken: {
        anzahl_monate: sortedHistory.length,
        gesamt_verbrauch_kwh: +totalConsumption.toFixed(2),
        durchschnitt_verbrauch_kwh: +averageConsumption.toFixed(2),
        gesamt_kosten_euro: +totalCosts.toFixed(2),
        durchschnitt_kosten_euro: sortedHistory.length > 0 ? +(totalCosts / sortedHistory.length).toFixed(2) : 0,
        cent_pro_kwh_durchschnitt: totalConsumption > 0 ? +((totalCosts / totalConsumption) * 100).toFixed(2) : 0
      },
      zeitraum: {
        von: startDate || (sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1].datum : null),
        bis: endDate || (sortedHistory.length > 0 ? sortedHistory[0].datum : null)
      }
    }, 'Verbrauchshistorie erfolgreich abgerufen');

  } catch (error) {
    console.error('Consumption history error:', error);
    sendError(res, 'Fehler beim Abrufen der Verbrauchshistorie', 500);
  }
});

// Delete customer account
app.delete('/api/v1/kunden/konto-loeschen', authenticateToken, (req, res) => {
  try {
    const { bestaetigung, grund } = req.body;

    if (bestaetigung !== 'KONTO_LOESCHEN') {
      return sendError(res, 'Bestätigung erforderlich', 400, [
        { feld: 'bestaetigung', nachricht: 'Zur Sicherheit muss "KONTO_LOESCHEN" eingegeben werden' }
      ]);
    }

    // Check for active contracts
    const activeContracts = mockDatabase.findContractsByCustomerId(req.user.kunden_id)
      .filter(contract => contract.status === 'aktiv');

    if (activeContracts.length > 0) {
      return sendError(res, 'Konto kann nicht gelöscht werden', 409, [
        { feld: 'vertraege', nachricht: 'Es bestehen noch aktive Verträge. Bitte kündigen Sie diese zuerst.' }
      ]);
    }

    // Soft delete - mark as inactive instead of actual deletion
    const updatedCustomer = mockDatabase.updateCustomer(req.user.kunden_id, {
      ist_aktiv: false,
      ist_gesperrt: true,
      geloescht_am: new Date(),
      loeschungsgrund: grund || 'Kundenantrag'
    });

    if (updatedCustomer) {
      sendResponse(res, true, {
        kunden_id: req.user.kunden_id,
        geloescht_am: updatedCustomer.geloescht_am,
        status: 'deaktiviert'
      }, 'Konto erfolgreich zur Löschung markiert');
    } else {
      sendError(res, 'Kunde nicht gefunden', 404);
    }

  } catch (error) {
    console.error('Account deletion error:', error);
    sendError(res, 'Fehler bei der Kontolöschung', 500);
  }
});

// ================================
// CONTRACT MANAGEMENT ENDPOINTS
// ================================

// Get customer contracts
app.get('/api/v1/vertraege', authenticateToken, (req, res) => {
  try {
    const contracts = mockDatabase.findContractsByCustomerId(req.user.kunden_id);

    const enrichedContracts = contracts.map(contract => {
      const tariff = mockDatabase.findTariffById(contract.tarif_id);
      
      return {
        vertrag_id: contract.vertrag_id,
        tarif: tariff ? {
          id: tariff.id,
          name: tariff.tarif_name,
          typ: tariff.tarif_typ
        } : null,
        status: contract.status,
        vertragsbeginn: contract.vertragsbeginn,
        vertragsende: contract.vertragsende,
        geschaetzter_jahresverbrauch: contract.geschaetzter_jahresverbrauch,
        abschlagszahlung_euro: contract.abschlagszahlung_euro,
        zahlungsweise: contract.zahlungsweise,
        erstellt_am: contract.erstellt_am,
        genehmigt_am: contract.genehmigt_am,
        kuendigungsdatum: contract.kuendigungsdatum,
        kuendigungsgrund: contract.kuendigungsgrund
      };
    });

    sendResponse(res, true, {
      vertraege: enrichedContracts,
      anzahl: enrichedContracts.length
    }, 'Verträge erfolgreich abgerufen');

  } catch (error) {
    console.error('Contracts retrieval error:', error);
    sendError(res, 'Fehler beim Abrufen der Verträge', 500);
  }
});

// Create contract draft
app.post('/api/v1/vertraege/entwurf', authenticateToken, (req, res) => {
  try {
    const { tarif_id, kampagne_id, geschaetzter_jahresverbrauch } = req.body;

    // Validate tariff exists and is active
    const tariff = mockDatabase.findTariffById(tarif_id);
    if (!tariff) {
      return sendError(res, 'Tarif nicht gefunden', 404);
    }

    if (!tariff.ist_aktiv) {
      return sendError(res, 'Tarif ist nicht verfügbar', 422);
    }

    // Validate consumption
    if (!geschaetzter_jahresverbrauch || geschaetzter_jahresverbrauch < 500 || geschaetzter_jahresverbrauch > 50000) {
      return sendError(res, 'Validierungsfehler', 400, [
        { feld: 'geschaetzter_jahresverbrauch', nachricht: 'Jahresverbrauch muss zwischen 500 und 50.000 kWh liegen' }
      ]);
    }

    // Create contract draft
    const contractData = DummyDataGenerator.generateContract(req.user.kunden_id, tarif_id, {
      kampagne_id: kampagne_id || `kampagne_${Date.now()}`,
      geschaetzter_jahresverbrauch,
      status: 'entwurf'
    });

    const newContract = mockDatabase.createContract(contractData);

    sendResponse(res, true, {
      vertrag: {
        vertrag_id: newContract.vertrag_id,
        tarif: {
          id: tariff.id,
          name: tariff.tarif_name,
          typ: tariff.tarif_typ
        },
        status: newContract.status,
        geschaetzter_jahresverbrauch: newContract.geschaetzter_jahresverbrauch,
        vertragsbeginn: newContract.vertragsbeginn,
        vertragsende: newContract.vertragsende,
        abschlagszahlung_euro: newContract.abschlagszahlung_euro,
        erstellt_am: newContract.erstellt_am
      }
    }, 'Vertragsentwurf erfolgreich erstellt', 201);

  } catch (error) {
    console.error('Contract draft creation error:', error);
    sendError(res, 'Fehler bei der Erstellung des Vertragsentwurfs', 500);
  }
});

// ================================
// CUSTOMER MANAGEMENT ENDPOINTS (CONTINUED)
// ================================

// Get customer profile
app.get('/api/v1/kunden/profil', authenticateToken, (req, res) => {
  const customer = mockDatabase.findCustomerById(req.user.kunden_id);
  
  if (!customer) {
    return sendError(res, 'Kunde nicht gefunden', 404);
  }

  sendResponse(res, true, {
    kunde: {
      kunden_id: customer.kunden_id,
      email: customer.email,
      vorname: customer.vorname,
      nachname: customer.nachname,
      telefon: customer.telefon,
      strasse: customer.strasse,
      hausnummer: customer.hausnummer,
      plz: customer.plz,
      stadt: customer.stadt,
      bezirk: customer.bezirk,
      bundesland: customer.bundesland,
      land: customer.land,
      bevorzugte_sprache: customer.bevorzugte_sprache,
      newsletter_einverstaendnis: customer.newsletter_einverstaendnis,
      ist_verifiziert: customer.ist_verifiziert,
      erstellt_am: customer.erstellt_am,
      letzter_login: customer.letzter_login
    }
  }, 'Kundenprofil erfolgreich abgerufen');
});

// Update customer profile
app.put('/api/v1/kunden/profil', authenticateToken, (req, res) => {
  try {
    const customer = mockDatabase.findCustomerById(req.user.kunden_id);
    
    if (!customer) {
      return sendError(res, 'Kunde nicht gefunden', 404);
    }

    // Update allowed fields
    const allowedFields = ['telefon', 'strasse', 'hausnummer', 'plz', 'stadt', 'bevorzugte_sprache', 'newsletter_einverstaendnis'];
    const updates = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedCustomer = mockDatabase.updateCustomer(req.user.kunden_id, updates);

    sendResponse(res, true, {
      kunde: updatedCustomer
    }, 'Kundenprofil erfolgreich aktualisiert');

  } catch (error) {
    console.error('Profile update error:', error);
    sendError(res, 'Fehler bei der Profilaktualisierung', 500);
  }
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🤖 EVU Backend Dummy API läuft auf Port ${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/health`);
  console.log(`📋 API Info: http://localhost:${PORT}/info`);
  console.log(`🔧 Environment: TEST`);
  
  // Initialize dummy data
  DummyDataGenerator.initializeTestData();
  console.log(`✅ Dummy-Daten initialisiert`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔴 Dummy API Server wird heruntergefahren...');
  server.close(() => {
    console.log('✅ Dummy API Server beendet');
    process.exit(0);
  });
});

module.exports = app;