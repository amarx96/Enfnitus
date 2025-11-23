# Enfinitus Energie - Chakra UI Frontend

Moderne, schliche Frontend-Version mit Chakra UI Design in weiß-grün.

## Features

- 🎨 **Modernes Design**: Minimalistisches weiß-grünes Chakra UI Design
- 📱 **Responsive**: Optimiert für alle Bildschirmgrößen
- ⚡ **Performance**: Schnelle Ladezeiten und flüssige Animationen
- 🎫 **Voucher System**: Integrierte WELCOME2025 Voucher-Funktionalität
- 🌱 **Nachhaltigkeit**: Fokus auf Ökostrom und umweltfreundliche Tarife

## Schnellstart

```bash
# Dependencies installieren
npm install

# Development Server starten (Port 3001)
npm start

# Production Build erstellen
npm run build
```

## Struktur

```
src/
├── components/
│   └── Layout.tsx          # Hauptlayout mit Navigation
├── pages/
│   ├── HomePage.tsx        # Landing Page
│   ├── PricingPage.tsx     # Tarifberechnung
│   └── ContractPage.tsx    # Vertragsabschluss
├── theme.ts                # Chakra UI Theme
├── App.tsx                 # Hauptkomponente
└── index.tsx              # Entry Point
```

## Design System

- **Farben**: Weiß-grüne Farbpalette mit brand.500 = #22c55e
- **Typography**: Inter Font Familie
- **Komponenten**: Chakra UI mit Custom Theme
- **Animationen**: Framer Motion für flüssige Übergänge

## API Integration

Das Frontend kommuniziert mit dem Backend über:
- `GET /api/v1/pricing/berechnen` - Tarifberechnung
- `POST /api/v1/voucher/validate` - Voucher-Validierung

## Voucher System

Der WELCOME2025 Voucher Code ist vollständig integriert:
- Real-time Validierung beim Eingeben
- Automatische Rabattberechnung (25%)
- Visuelle Bestätigung mit Success-Alerts