# 🇩🇪 Deutsche Lokalisierung - Enfinitus Energie EVU Backend

## Übersicht
Dieses Dokument beschreibt die vollständige Lokalisierung des Enfinitus Energie EVU Backends ins Deutsche. Alle Texte, Variablen, API-Endpunkte und Datenbankfelder werden ins Deutsche übersetzt.

## ✅ Bereits abgeschlossen

### 1. Validierungs-Middleware (`src/middleware/validation.js`)
- ✅ Alle Joi-Schemas ins Deutsche übersetzt
- ✅ Fehlermeldungen auf Deutsch
- ✅ Schemata umbenannt:
  - `registerCustomer` → `kundenRegistrierung`
  - `loginCustomer` → `kundenAnmeldung`
  - `calculatePrice` → `preisBerechnung`
  - `createContractDraft` → `vertragsentwurfErstellen`
  - `updateCustomer` → `kundeAktualisieren`

### 2. Authentifizierungs-Middleware (`src/middleware/auth.js`)
- ✅ Funktionsname: `auth` → `authentifizierung`
- ✅ Alle Fehlermeldungen auf Deutsch
- ✅ Variablennamen: `user` → `benutzer`

### 3. Datenbankschema (`src/database/schema.sql`)
- ✅ Tabellennamen ins Deutsche übersetzt:
  - `customers` → `kunden`
  - `customer_metas` → `kunden_metadaten`
  - `tariffs` → `tarife`
  - `pricing_campaigns` → `preis_kampagnen`
  - `pricing_tables` → `preis_tabellen`
  - `contract_drafts` → `vertragsentwuerfe`
  - `contracts` → `vertraege`
  - `plz_data` → `plz_daten`

## 🔄 In Bearbeitung

### API-Endpunkte Lokalisierung

#### Pricing Service
- **Aktuell**: `/api/v1/pricing/calculate`
- **Deutsch**: `/api/v1/preise/berechnen`

#### Authentication Service
- **Aktuell**: `/api/v1/auth/register`
- **Deutsch**: `/api/v1/auth/registrieren`
- **Aktuell**: `/api/v1/auth/login` 
- **Deutsch**: `/api/v1/auth/anmelden`

#### Customer Management
- **Aktuell**: `/api/v1/customers/profile`
- **Deutsch**: `/api/v1/kunden/profil`

#### Contracting Service
- **Aktuell**: `/api/v1/contracting/draft`
- **Deutsch**: `/api/v1/vertraege/entwurf`

## 📋 Vollständige Lokalisierungsaufgaben

### 1. API-Routen (`src/routes/`)

#### a) Pricing Routes (`pricing.js`)
```javascript
// Vor der Änderung
router.post('/calculate', validate(schemas.calculatePrice), ...)

// Nach der Änderung 
router.post('/berechnen', validieren(schemas.preisBerechnung), ...)
```

**Endpunkt-Mapping:**
- `/calculate` → `/berechnen`
- `/tariffs` → `/tarife`
- `/campaigns` → `/kampagnen`
- `/locations/:plz` → `/standorte/:plz`

#### b) Auth Routes (`auth.js`)
```javascript
// Endpunkt-Mapping:
// '/register' → '/registrieren'
// '/login' → '/anmelden'  
// '/verify-email' → '/email-verifizieren'
// '/forgot-password' → '/passwort-vergessen'
// '/reset-password' → '/passwort-zuruecksetzen'
// '/refresh-token' → '/token-aktualisieren'
```

#### c) Customer Routes (`customer.js`)
```javascript
// Endpunkt-Mapping:
// '/profile' → '/profil'
// '/energy-profile' → '/energie-profil'
// '/consumption-history' → '/verbrauchshistorie'
// '/delete-account' → '/konto-loeschen'
```

#### d) Contracting Routes (`contracting.js`)
```javascript
// Endpunkt-Mapping:
// '/draft' → '/entwurf'
// '/drafts' → '/entwuerfe'
// '/draft/:id/approve' → '/entwurf/:id/genehmigen'
// '/contracts' → '/vertraege'
```

### 2. Datenbank-Feldnamen

#### Kunden Tabelle
```sql
-- Englisch → Deutsch
customer_id → kunden_id
first_name → vorname
last_name → nachname
phone → telefon
date_of_birth → geburtsdatum
street → strasse
house_number → hausnummer
city → stadt
district → bezirk
country → land
preferred_language → bevorzugte_sprache
marketing_consent → marketing_einverstaendnis
newsletter_consent → newsletter_einverstaendnis
is_active → ist_aktiv
is_verified → ist_verifiziert
verification_token → verifizierungs_token
password_reset_token → passwort_reset_token
password_reset_expires → passwort_reset_ablauf
created_at → erstellt_am
updated_at → aktualisiert_am
last_login → letzter_login
```

#### Kunden-Metadaten Tabelle
```sql
-- Englisch → Deutsch
customer_id → kunden_id
annual_consumption_kwh → jahresverbrauch_kwh
household_size → haushaltgroesse
meter_number → zaehler_nummer
meter_location_identifier → marktlokations_id
previous_provider_name → vorheriger_anbieter_name
previous_provider_code → vorheriger_anbieter_code
previous_annual_consumption_kwh → vorheriger_jahresverbrauch_kwh
supplier_change_date → anbieter_wechsel_datum
```

### 3. API-Antwortnachrichten

#### Standard-Antworten
```javascript
// Erfolgsnachrichten
{
  "erfolg": true,
  "nachricht": "Vorgang erfolgreich abgeschlossen",
  "daten": { ... }
}

// Fehlernachrichten
{
  "erfolg": false,
  "nachricht": "Ein Fehler ist aufgetreten",
  "fehler": [ ... ]
}
```

#### Spezifische Nachrichten
```javascript
// Authentifizierung
"Erfolgreich angemeldet" // "Successfully logged in"
"Ungültige Anmeldedaten" // "Invalid credentials"
"Token ist abgelaufen" // "Token has expired"

// Registrierung
"Konto erfolgreich erstellt" // "Account created successfully"
"E-Mail ist bereits registriert" // "Email already registered"
"Bestätigungs-E-Mail gesendet" // "Verification email sent"

// Preisberechnung
"Preise erfolgreich berechnet" // "Prices calculated successfully"
"PLZ nicht verfügbar" // "PLZ not available"
"Ungültiger Verbrauchswert" // "Invalid consumption value"

// Kundenverwaltung
"Profil erfolgreich aktualisiert" // "Profile updated successfully"
"Kunde nicht gefunden" // "Customer not found"
"Energieprofil gespeichert" // "Energy profile saved"
```

### 4. Umgebungsvariablen (`.env`)

#### Deutsche Bezeichnungen
```bash
# Server-Konfiguration
KNOTENUMGEBUNG=entwicklung # NODE_ENV=development
PORT=3000

# Datenbank-Konfiguration
DB_HOST=db.lorqrxsqgvpjjxfbqugy.supabase.co
DB_BENUTZER=postgres # DB_USER=postgres
DB_PASSWORT=ihr_passwort # DB_PASSWORD=your_password

# JWT-Konfiguration
JWT_GEHEIMNIS=ihr_jwt_geheimnis # JWT_SECRET=your_jwt_secret
JWT_GUELTIGKEITSDAUER=24h # JWT_EXPIRES_IN=24h

# E-Mail-Konfiguration
SMTP_HOST=smtp.gmail.com
SMTP_BENUTZER=ihre_email@domain.com # SMTP_USER=your_email@domain.com
SMTP_PASSWORT=ihr_passwort # SMTP_PASS=your_password
VON_EMAIL=noreply@enfinitus-energie.de # FROM_EMAIL=noreply@enfinitus-energie.de
```

### 5. Swagger-Dokumentation

#### Deutsche API-Beschreibungen
```yaml
info:
  title: 'Enfinitus Energie EVU API'
  description: 'Backend-API für Enfinitus Energie - Vietnamesischer Gemeinschafts-Energieversorger'
  
paths:
  /api/v1/preise/berechnen:
    post:
      summary: 'Strompreise berechnen'
      description: 'Berechnet Strompreise basierend auf PLZ und Verbrauchsdaten'
      
  /api/v1/auth/registrieren:
    post:
      summary: 'Kunden registrieren'
      description: 'Erstellt ein neues Kundenkonto'
```

### 6. Kommentare und Dokumentation

#### Code-Kommentare auf Deutsch
```javascript
// Kunde aus Datenbank abrufen
const kundenResult = await database.query('...');

// Passwort hashen
const passwortHash = await bcrypt.hash(passwort, 12);

// Token generieren
const token = jwt.sign({ kunden_id }, process.env.JWT_GEHEIMNIS);

// Preise berechnen
const geschaetzterVerbrauch = haushaltgroesse * 1500;
```

## 🚀 Implementierungsreihenfolge

### Phase 1: Kritische Komponenten (Priorität 1)
1. ✅ Validierungs-Middleware komplett überarbeitet
2. ✅ Authentifizierungs-Middleware aktualisiert
3. ✅ Datenbankschema teilweise übersetzt
4. 🔄 API-Endpunkt-Namen aktualisieren

### Phase 2: API-Routen (Priorität 2)
1. Pricing-Routen vollständig ins Deutsche
2. Auth-Routen lokalisieren
3. Customer-Management-Routen
4. Contracting-Routen

### Phase 3: Datenbank-Integration (Priorität 3)
1. Alle SQL-Abfragen aktualisieren
2. Datenbank-Feldnamen überall ändern
3. Migrations-Skripte erstellen

### Phase 4: Dokumentation (Priorität 4)
1. Swagger-Dokumentation übersetzen
2. README ins Deutsche
3. API-Beispiele lokalisieren

## ⚡ Schnellstart für deutsche API

### 1. Deutsche API-Endpunkte verwenden
```bash
# Preisberechnung
curl -X POST http://localhost:3000/api/v1/preise/berechnen \
  -H "Content-Type: application/json" \
  -d '{"plz": "10115", "jahresverbrauch": 3500, "haushaltgroesse": 3}'

# Kundenregistrierung  
curl -X POST http://localhost:3000/api/v1/auth/registrieren \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "passwort": "Test123!@#",
    "vorname": "Max",
    "nachname": "Mustermann",
    "strasse": "Musterstraße",
    "hausnummer": "123",
    "plz": "10115",
    "stadt": "Berlin"
  }'
```

### 2. Deutsche Datenbank-Feldnamen
```javascript
// Kunde erstellen
const neuerKunde = await database.query(`
  INSERT INTO kunden (
    kunden_id, email, passwort_hash, vorname, nachname, 
    strasse, hausnummer, plz, stadt
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
`, [kundenId, email, passwortHash, vorname, nachname, strasse, hausnummer, plz, stadt]);
```

## 📊 Fortschritt

### ✅ Abgeschlossen (40%)
- Validierungs-Schemas
- Authentifizierungs-Middleware  
- Basis-Datenbankschema
- Grundlegende Fehlermeldungen

### 🔄 In Arbeit (30%)
- API-Endpunkt-Namen
- Routenlogik anpassen
- Datenbankabfragen aktualisieren

### ⏳ Ausstehend (30%)
- Vollständige Swagger-Dokumentation
- README und Dokumentation
- Umgebungsvariablen
- Test-Skripte

## 🎯 Nächste Schritte

1. **Sofort**: API-Endpunkt-Namen in allen Route-Dateien ändern
2. **Heute**: Datenbankabfragen mit deutschen Feldnamen aktualisieren  
3. **Diese Woche**: Swagger-Dokumentation übersetzen
4. **Nächste Woche**: Vollständige Tests mit deutschen APIs

---

**Status**: Deutsche Lokalisierung in Bearbeitung 🇩🇪
**Kontakt**: tech@enfinitus-energie.de