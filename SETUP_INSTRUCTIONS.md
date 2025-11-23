# 🚀 EVU System Setup - Rabot Energy & Viet Energie

This system has been updated to support the Rabot Energy "Beistell Model" and the new Viet Energie brand.

## 🏗️ Architecture Changes

1.  **Pricing Source**: Switched from local `pricing-berlin.json` (ENET placeholder) to **Rabot Energy** (Mocked API).
    *   Implemented `RabotPricingService` in backend.
    *   Updated `PricingService` to fetch dynamic rates asynchronously.
2.  **Viet Energie Brand**:
    *   Dedicated Frontend running on Port 3002.
    *   Localized content and currency (€).
3.  **Services Removed**:
    *   Energy Management Service & Market Communication Gateway are excluded as per Rabot partnership.

## 🛠️ Setup Steps

### 1. Configure Environment (`.env`)

Create a `.env` file in the root directory with the following content (replace placeholders):

```properties
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
# REPLACE [YOUR_PASSWORD] with your actual password
SUPABASE_URL=https://lorqrxsqgvpjjxfbqugy.supabase.co
SUPABASE_ANON_KEY=PLACEHOLDER_KEY_PLEASE_REPLACE
DB_CONNECTION_STRING=postgresql://postgres:[YOUR_PASSWORD]@db.lorqrxsqgvpjjxfbqugy.supabase.co:5432/postgres

# Security
JWT_SECRET=dev-secret-key-change-in-prod

# CORS Configuration (Allowing both frontends)
FRONTEND_URL=http://localhost:3001
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:3000,http://127.0.0.1:3001,http://127.0.0.1:3002

# Rabot Energy Integration
RABOT_API_URL=https://api.rabot-energy.mock/v1
RABOT_API_KEY=mock-key
```

### 2. Start the System

Run the `start-complete-system.bat` script to launch all components:

*   **Backend**: http://localhost:3000
*   **Enfinitus Frontend**: http://localhost:3001
*   **Viet Energie Frontend**: http://localhost:3002

## 🧪 Testing

1.  **Pricing**: Go to either frontend and calculate a price. The data now comes from the `RabotPricingService`.
2.  **Viet Energie**: Check http://localhost:3002 for the Vietnamese branded experience.
3.  **Database**: The system is configured to connect to your Supabase instance `lorqrxsqgvpjjxfbqugy`.

## 📁 Project Structure

*   `src/`: Backend (Node.js/Express)
*   `frontend-chakra/`: Enfinitus Frontend (React)
*   `frontend-viet/`: Viet Energie Frontend (React)
*   `start-complete-system.bat`: Launcher script

