# 🌟 EVU Full-Stack Application Setup Guide

Complete setup guide for the Enfinitus Energie EVU (Energy Utility) pricing and customer management system.

## 📋 System Overview

### Backend (Node.js/Express)
- **Location**: `/src/`
- **Port**: 3000
- **Features**: REST APIs for pricing, customer management, contract drafts
- **Database**: PostgreSQL (disabled for development)
- **Documentation**: Swagger UI at `http://localhost:3000/api-docs`

### Frontend (React/TypeScript)
- **Location**: `/frontend/`
- **Port**: 3001  
- **Features**: Pricing calculator, customer registration, contract management
- **UI Framework**: Material-UI v5
- **API Integration**: Axios with proxy to backend

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Windows PowerShell or Command Prompt
- Git (optional)

### Option 1: Automated Setup (Recommended)

```bash
# Install frontend dependencies
install-frontend.bat

# Start both backend and frontend
start-full-stack.bat
```

### Option 2: Manual Setup

#### Backend Setup
```bash
# Install backend dependencies (if not already done)
npm install

# Start backend server
npm start
# OR
node src/server.js
```

#### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

## 🌐 Application URLs

After starting both services:

- **Frontend Application**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

## 📱 User Journey

### 1. Pricing Calculator (`http://localhost:3001/`)

**Form Features**:
- **PLZ Input**: German postal code (5 digits)
- **Household Size**: Slider from 1-8+ people
- **Annual Consumption**: Optional manual override
- **Smart Meter**: Current ownership and desire options
- **Solar PV**: Current installation and interest
- **Electric Vehicle**: EV ownership for consumption calculation

**Backend Integration**: 
- `POST /api/v1/pricing/berechnen`
- Automatic consumption estimation
- Real-time validation

### 2. Pricing Results (`/results`)

**Features**:
- Location-specific tariff display
- Monthly and annual cost calculations
- Tariff comparison (fixed, green, dynamic)
- Recommended tariff highlighting
- Mobile-responsive cards

**Backend Integration**:
- Tariff data from pricing calculation
- Location information display

### 3. Customer Registration (`/customer`)

**Form Sections**:
- **Personal Info**: First name, last name
- **Address**: Street, number, PLZ, city
- **Contact**: Email (required), phone (optional)
- **Validation**: Real-time German address validation

**Backend Integration**:
- `POST /api/v1/auth/register`
- Automatic customer account creation

### 4. Contract Summary (`/contract`)

**Features**:
- Complete tariff and pricing summary
- Customer information review
- Contract draft creation
- PDF download functionality
- Email confirmation

**Backend Integration**:
- `POST /api/v1/vertraege/entwuerfe`
- Automated contract draft generation
- Email notification system

## 🔧 Configuration

### Backend Configuration (`.env`)

```properties
# Server
NODE_ENV=development
PORT=3000

# Database (disabled for development)
DB_ENABLED=false

# JWT
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=24h

# CORS
FRONTEND_URL=http://localhost:3001
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Frontend Configuration

The frontend is configured via `package.json` proxy and environment variables:

```json
{
  "proxy": "http://localhost:3000"
}
```

## 🛠️ Development

### Backend Development

```bash
# Start with auto-reload
npm run dev

# Run tests
npm test

# Check code coverage
npm run test -- --coverage
```

### Frontend Development

```bash
cd frontend

# Start development server
npm start

# Type checking
npm run type-check

# Build production version
npm run build

# Preview production build
npm run preview
```

## 🧪 Testing the Application

### 1. Backend Health Check
```bash
curl http://localhost:3000/health
```

### 2. API Testing
Use the Swagger UI at `http://localhost:3000/api-docs` or:

```bash
# Test pricing calculation
curl -X POST http://localhost:3000/api/v1/pricing/berechnen \
  -H "Content-Type: application/json" \
  -d "{\"plz\":\"10115\",\"haushaltgroesse\":3}"
```

### 3. Frontend Testing
1. Navigate to `http://localhost:3001`
2. Enter PLZ: `10115`
3. Set household size: `3 people`
4. Click "Dein Strompreis bei Tibber"
5. Verify tariff results appear
6. Select a tariff
7. Fill customer form
8. Complete contract creation

## 🔍 API Endpoints

### Pricing APIs
- `POST /api/v1/pricing/berechnen` - Calculate pricing
- `GET /api/v1/pricing/tariffe` - List tariffs
- `GET /api/v1/pricing/standorte/:plz` - Location info

### Authentication APIs
- `POST /api/v1/auth/register` - Customer registration
- `POST /api/v1/auth/login` - Customer login
- `POST /api/v1/auth/verify-email` - Email verification

### Customer APIs
- `GET /api/v1/kunde/profil` - Customer profile
- `PUT /api/v1/kunde/profil` - Update profile

### Contract APIs
- `POST /api/v1/vertraege/entwuerfe` - Create contract draft
- `GET /api/v1/vertraege/entwuerfe` - List drafts
- `GET /api/v1/vertraege/entwuerfe/:id` - Get specific draft

## 📁 Project Structure

```
EVU_Backend/
├── src/                          # Backend source code
│   ├── routes/                   # API route handlers
│   │   ├── pricing.js           # Pricing calculations
│   │   ├── auth.js              # Authentication
│   │   ├── customer.js          # Customer management
│   │   └── contracting.js       # Contract management
│   ├── middleware/              # Express middleware
│   ├── config/                  # Configuration files
│   ├── utils/                   # Utility functions
│   └── server.js               # Main server file
├── frontend/                    # React frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── PricingForm.tsx  # Main pricing form
│   │   │   ├── PricingResults.tsx # Tariff results
│   │   │   ├── CustomerForm.tsx  # Customer data form
│   │   │   └── ContractSummary.tsx # Contract creation
│   │   ├── services/            # API service layer
│   │   ├── App.tsx             # Main app component
│   │   └── index.tsx           # App entry point
│   ├── public/                 # Static assets
│   └── package.json           # Frontend dependencies
├── tests/                      # Backend tests
├── .env                       # Environment configuration
├── package.json              # Backend dependencies
├── install-frontend.bat      # Frontend setup script
└── start-full-stack.bat      # Full application startup
```

## 🚨 Troubleshooting

### Common Issues

#### Backend won't start
```bash
# Check if port 3000 is already in use
netstat -ano | findstr :3000

# Kill process if needed
taskkill /PID <process_id> /F
```

#### Frontend can't connect to backend
1. Verify backend is running on port 3000
2. Check CORS configuration in `.env`
3. Ensure proxy setting in `frontend/package.json`

#### Database errors
The database is disabled for development. If you see database-related errors:
1. Check `DB_ENABLED=false` in `.env`
2. Restart the backend server

#### Node.js/npm issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port Conflicts
If default ports are in use:

**Backend** (change in `.env`):
```properties
PORT=3001
```

**Frontend** (change in `package.json`):
```json
{
  "scripts": {
    "start": "PORT=3002 react-scripts start"
  }
}
```

## 🔐 Security Notes

### Development Security
- JWT secret is set for development only
- Database is disabled by default
- CORS is configured for localhost only
- Rate limiting is enabled

### Production Considerations
- Change JWT secret to a strong, random value
- Enable and configure PostgreSQL database
- Update CORS origins for production domains
- Configure HTTPS
- Set up proper logging and monitoring
- Enable additional security middleware

## 📞 Support

For issues or questions:

1. Check this documentation
2. Review console logs in browser and terminal
3. Verify all services are running on correct ports
4. Check network connectivity between frontend and backend

## 🎯 Next Steps

After successful setup:

1. **Customize Branding**: Update colors, logos, and text in the frontend
2. **Database Setup**: Configure PostgreSQL for production data
3. **Email Integration**: Set up real email service for customer notifications
4. **Payment Integration**: Add payment processing for contract finalization
5. **Admin Panel**: Create admin interface for managing customers and contracts
6. **Monitoring**: Set up logging and performance monitoring
7. **Testing**: Add comprehensive test suites
8. **Deployment**: Configure production deployment pipeline

## 📄 License

Copyright © 2024 Enfinitus Energie. All rights reserved.