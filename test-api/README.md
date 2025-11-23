# EVU Backend Test Environment

Comprehensive dummy API environment for testing German energy provider (EVU) backend services with realistic data.

## 🚀 Quick Start

### Windows
```powershell
.\start-test-environment.bat
```

### Linux/macOS
```bash
chmod +x start-test-environment.sh
./start-test-environment.sh
```

## 📋 Overview

This test environment provides:
- **Dummy API Server**: Complete EVU backend simulation
- **Realistic German Data**: Customer profiles, tariffs, PLZ-based pricing
- **Authentication Flow**: JWT-based user management
- **Integration Tests**: Comprehensive test suite for all services
- **Mock Database**: In-memory data storage with CRUD operations

## 🏗️ Architecture

```
test-api/
├── server.js                          # Main API server
├── test-api-client.js                 # API testing client
├── test-environment.js                # Configuration
├── data/
│   ├── mockDatabase.js               # In-memory database
│   └── dummyDataGenerator.js         # German EVU data generator
└── package.json                       # Dependencies

tests/integration/
└── dummy-api.test.js                  # Integration test suite
```

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/verify` - Token verification

### Customers (Kunden)
- `GET /api/v1/kunden` - List customers
- `POST /api/v1/kunden` - Create customer
- `GET /api/v1/kunden/:id` - Get customer details
- `PUT /api/v1/kunden/:id` - Update customer
- `DELETE /api/v1/kunden/:id` - Delete customer

### Pricing (Preise)
- `GET /api/v1/preise` - List all tariffs
- `GET /api/v1/preise/plz/:plz` - Get prices by postal code
- `POST /api/v1/preise/kalkulation` - Calculate pricing

### Contracts (Verträge)
- `GET /api/v1/vertraege` - List contracts
- `POST /api/v1/vertraege` - Create contract
- `GET /api/v1/vertraege/:id` - Get contract details
- `PUT /api/v1/vertraege/:id` - Update contract

### Energy Data
- `GET /api/v1/energie/verbrauch/:kundeId` - Get consumption history
- `POST /api/v1/energie/verbrauch` - Record consumption
- `GET /api/v1/energie/zaehlerdaten/:kundeId` - Get meter data

## 🧪 Running Tests

### Quick API Test
```bash
cd test-api
node test-api-client.js
```

### Full Integration Tests
```bash
npm test -- tests/integration/dummy-api.test.js
```

### With Test Environment
```bash
set USE_TEST_API=true
set NODE_ENV=test-integration
npm test
```

## 🔧 Configuration

### Environment Variables
- `TEST_API_PORT=3001` - API server port
- `NODE_ENV=test` - Environment mode
- `JWT_SECRET=test-dummy-api-secret-2024` - JWT signing secret
- `USE_TEST_API=true` - Use dummy API for tests

### Mock Data Configuration
```javascript
const config = {
  initialCustomers: 50,
  tariffCount: 8,
  maxConsumptionHistory: 24, // months
  plzCount: 200, // German postal codes
  contractTypes: ['Strom', 'Gas', 'Kombi']
};
```

## 📊 Test Coverage

The integration test suite covers:

### ✅ Authentication Flow
- User registration and login
- JWT token verification
- Password hashing validation

### ✅ Customer Management
- CRUD operations
- Profile validation
- German address formatting

### ✅ Pricing Services
- PLZ-based pricing lookup
- Tariff calculations
- Seasonal adjustments

### ✅ Contract Management
- Contract creation and updates
- Lifecycle management
- Validation rules

### ✅ Energy Data
- Consumption tracking
- Meter readings
- Historical data analysis

### ✅ End-to-End Scenarios
- Complete user journeys
- Concurrent request handling
- Performance testing

## 🌍 German EVU Specifics

### Realistic Test Data
- **Names**: German first/last names
- **Addresses**: Real German cities and postal codes
- **Consumption**: Seasonal patterns (higher in winter)
- **Tariffs**: Standard German energy pricing models
- **Contracts**: Typical EVU contract structures

### Postal Code Support
- 200+ German PLZ codes
- Regional pricing variations
- Network zone calculations

### Energy Types
- Strom (Electricity)
- Gas (Natural Gas)
- Kombi (Combined services)

## 🔍 Health Monitoring

### Health Check
```bash
curl http://localhost:3001/health
```

### API Information
```bash
curl http://localhost:3001/info
```

### Database Statistics
```bash
curl http://localhost:3001/api/v1/stats
```

## 🛠️ Development Usage

### Starting the Environment
1. Start dummy API server
2. Run integration tests
3. Monitor health endpoints
4. Use for development testing

### Testing Real Services
Replace API calls in your services with the dummy API URL:
```javascript
const API_BASE = process.env.NODE_ENV === 'test' 
  ? 'http://localhost:3001/api/v1'
  : 'https://your-real-api.com/api/v1';
```

### Performance Testing
The dummy API supports concurrent requests and realistic response times:
```javascript
// Concurrent request testing
const promises = Array(10).fill().map(() => 
  axios.get('http://localhost:3001/api/v1/kunden')
);
const results = await Promise.all(promises);
```

## 📈 Benefits

1. **Realistic Data**: German-specific EVU data patterns
2. **Complete Coverage**: All backend services simulated
3. **Fast Setup**: One-command environment startup
4. **Integration Ready**: Drop-in replacement for real API
5. **Performance Testing**: Concurrent request support
6. **Automated Testing**: Comprehensive test suite included

## 🔧 Troubleshooting

### Common Issues

**API not starting:**
- Check if port 3001 is available
- Verify Node.js 14+ is installed
- Check npm dependencies are installed

**Tests failing:**
- Ensure `USE_TEST_API=true` environment variable
- Verify API is running before tests
- Check network connectivity to localhost:3001

**Data issues:**
- Restart API to reset mock database
- Check German character encoding (UTF-8)
- Verify PLZ codes are valid

### Debug Mode
```bash
set DEBUG=dummy-api:*
node server.js
```

## 🚀 Next Steps

1. **Docker Setup**: Containerize test environment
2. **CI/CD Integration**: Add to build pipeline
3. **Load Testing**: Scale concurrent request testing
4. **Real Data Sync**: Periodic real API data updates
5. **Monitoring**: Add metrics and logging

---

**Ready to test your EVU backend services with realistic German energy sector data!** 🇩🇪⚡