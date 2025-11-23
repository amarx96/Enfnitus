# Enfinitus Energie EVU Backend

A comprehensive backend system for Enfinitus Energie, a Vietnamese community energy supplier in Germany. This Node.js/Express application provides pricing calculations, customer management, and contracting services for the German energy market.

## 🏗️ Architecture Overview

The backend consists of three main services:
- **Pricing Service** - PLZ-based energy price calculations and tariff comparisons
- **Customer Management Service** - User registration, authentication, and profile management
- **Contracting Service** - Contract draft creation, approval workflow, and contract management

## 🚀 Features

### Pricing Service
- PLZ-based pricing lookup for German postal codes
- Multiple tariff types (Fix12, Fix24, Dynamic)
- Consumption estimation based on household size
- Real-time price calculations with grid provider integration
- Campaign-based pricing with validity periods

### Customer Management
- Secure user registration and authentication (JWT)
- Email verification and password reset
- Comprehensive customer profiles with energy consumption data
- German address validation (PLZ, street, city)
- Multi-language support (German, Vietnamese, English)
- GDPR-compliant data handling

### Contracting Service
- Contract draft creation and management
- Customer approval workflow
- Contract activation and lifecycle management
- Integration with external billing systems
- Comprehensive contract history tracking

### Security Features
- JWT-based authentication
- Input validation with Joi schemas
- Rate limiting and DDoS protection
- CORS and security headers (Helmet)
- SQL injection prevention
- Password hashing with bcryptjs

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18.2
- **Database**: PostgreSQL (Supabase hosted)
- **Authentication**: JWT with bcryptjs
- **Validation**: Joi schemas
- **Documentation**: Swagger/OpenAPI 3.0
- **Logging**: Winston
- **Testing**: Jest (planned)
- **Process Management**: PM2 (production)

## 📦 Installation

### Prerequisites
- Node.js 18.0 or higher
- npm or yarn package manager
- PostgreSQL database (we use Supabase)
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd EVU_Backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration (Supabase)
DB_HOST=db.lorqrxsqgvpjjxfbqugy.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_supabase_password
DB_SSL=true

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (for verification/reset)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASS=your_email_password
FROM_EMAIL=noreply@enfinitus-energie.de

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.com

# External Integrations
RABOT_ENERGY_API_URL=https://api.rabot-energy.com
RABOT_ENERGY_API_KEY=your_api_key

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### 4. Database Setup
```bash
# Connect to your Supabase database
psql "postgresql://postgres:your_password@db.lorqrxsqgvpjjxfbqugy.supabase.co:5432/postgres"

# Run the schema migration
\i src/database/schema.sql

# Seed initial data (optional)
\i src/database/seed.sql
```

### 5. Start the Application

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` by default.

## 📚 API Documentation

Once the server is running, access the interactive API documentation at:
```
http://localhost:3000/api-docs
```

### Main API Endpoints

#### Authentication
- `POST /api/v1/auth/register` - Customer registration
- `POST /api/v1/auth/login` - Customer login
- `POST /api/v1/auth/verify-email` - Email verification
- `POST /api/v1/auth/forgot-password` - Password reset request
- `POST /api/v1/auth/reset-password` - Password reset confirmation
- `POST /api/v1/auth/refresh-token` - Refresh JWT token

#### Pricing
- `POST /api/v1/pricing/calculate` - Calculate energy prices by PLZ
- `GET /api/v1/pricing/tariffs` - List available tariffs
- `GET /api/v1/pricing/campaigns` - Get active pricing campaigns

#### Customer Management
- `GET /api/v1/customers/profile` - Get customer profile
- `PUT /api/v1/customers/profile` - Update customer profile
- `PUT /api/v1/customers/energy-profile` - Update energy consumption data
- `GET /api/v1/customers/consumption-history` - Get consumption history
- `DELETE /api/v1/customers/delete-account` - Deactivate account

#### Contracting
- `POST /api/v1/contracting/draft` - Create contract draft
- `GET /api/v1/contracting/drafts` - List customer's contract drafts
- `GET /api/v1/contracting/draft/:id` - Get specific contract draft
- `POST /api/v1/contracting/draft/:id/approve` - Customer approval
- `GET /api/v1/contracting/contracts` - List active contracts

## 🗄️ Database Schema

### Main Tables

#### customers
Stores customer account information, contact details, and preferences.

#### customer_metas
Extended customer information including energy consumption data, previous supplier details, and verification status.

#### tariffs
Available energy tariffs with pricing structure, validity periods, and terms.

#### pricing_campaigns
Marketing campaigns with special pricing and promotional offers.

#### pricing_tables
Detailed pricing data by PLZ and grid provider.

#### contract_drafts
Draft contracts awaiting customer approval.

#### contracts
Active customer contracts with terms, status, and billing information.

## 🚀 Quick Start

1. **Install dependencies**: `npm install`
2. **Set up environment**: Copy `.env.example` to `.env` and configure
3. **Initialize database**: `npm run migrate`
4. **Start development server**: `npm run dev`
5. **View API docs**: Visit `http://localhost:3000/api-docs`

## 🔧 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Application environment | No | development |
| `PORT` | Server port | No | 3000 |
| `DB_HOST` | Database host | Yes | - |
| `DB_PASSWORD` | Database password | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `SMTP_HOST` | Email server host | Yes | - |
| `ALLOWED_ORIGINS` | CORS allowed origins | No | localhost:3000 |

## 🔐 Security Features

- JWT-based authentication with secure password hashing
- Input validation and SQL injection prevention
- Rate limiting and CORS protection
- GDPR-compliant data handling
- Email verification and secure password reset

## 📞 Support

For technical support: **tech@enfinitus-energie.de**

---

**Enfinitus Energie EVU Backend** - Powering the future of community energy in Germany 🇩🇪🇻🇳

API documentation is available at `/api-docs` when the server is running.

## Environment Variables

See `.env.example` for required environment variables.

## Integration

- **Database**: Supabase PostgreSQL
- **Energy Provider**: Rabot Energy
- **Frontend**: WordPress with Elementor
- **Billing**: Third-party billing provider