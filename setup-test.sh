#!/bin/bash

# Enfinitus Energie EVU Backend - Quick Setup Test Script
# This script validates basic setup requirements and tests key endpoints

echo "🔋 Enfinitus Energie EVU Backend - Setup Validation"
echo "=================================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test variables
BASE_URL="http://localhost:3000"
API_BASE="$BASE_URL/api/v1"

echo ""
echo "📋 Checking Prerequisites..."

# Check if Node.js is installed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓${NC} Node.js found: $NODE_VERSION"
else
    echo -e "${RED}✗${NC} Node.js not found. Please install Node.js 18+"
    exit 1
fi

# Check if npm is installed
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓${NC} npm found: $NPM_VERSION"
else
    echo -e "${RED}✗${NC} npm not found. Please install npm"
    exit 1
fi

# Check if .env file exists
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file found"
else
    echo -e "${YELLOW}⚠${NC} .env file not found. Please copy .env.example to .env and configure"
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} Dependencies installed"
else
    echo -e "${YELLOW}⚠${NC} Dependencies not found. Run: npm install"
fi

echo ""
echo "🚀 Testing API Endpoints..."

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4
    
    echo -n "Testing $description... "
    
    if command -v curl &> /dev/null; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$endpoint" 2>/dev/null)
        if [ "$response" = "$expected_status" ]; then
            echo -e "${GREEN}✓${NC} ($response)"
        else
            echo -e "${RED}✗${NC} Expected $expected_status, got $response"
        fi
    else
        echo -e "${YELLOW}⚠${NC} curl not found, skipping HTTP tests"
    fi
}

# Test health endpoint
test_endpoint "GET" "$BASE_URL/health" "200" "Health Check"

# Test API documentation
test_endpoint "GET" "$BASE_URL/api-docs/" "200" "API Documentation"

# Test pricing endpoint (should return 400 for missing data)
test_endpoint "POST" "$API_BASE/pricing/calculate" "400" "Pricing Endpoint"

# Test auth endpoint (should return 400 for missing data)
test_endpoint "POST" "$API_BASE/auth/register" "400" "Registration Endpoint"

echo ""
echo "📊 Database Connection Test..."

# Test database connection if psql is available
if command -v psql &> /dev/null; then
    echo "Testing database connection..."
    # You would need to source the .env file to get DB credentials
    # This is a placeholder for actual database testing
    echo -e "${YELLOW}⚠${NC} Database test requires .env configuration"
else
    echo -e "${YELLOW}⚠${NC} psql not found, skipping database test"
fi

echo ""
echo "🔧 Quick Setup Commands:"
echo "========================"
echo "1. Install dependencies:     npm install"
echo "2. Configure environment:    cp .env.example .env"
echo "3. Start development server: npm run dev"
echo "4. View API documentation:   http://localhost:3000/api-docs"
echo ""

echo "📖 Key API Endpoints:"
echo "======================"
echo "• Health Check:    GET  $BASE_URL/health"
echo "• Registration:    POST $API_BASE/auth/register"
echo "• Login:           POST $API_BASE/auth/login"
echo "• Price Calculate: POST $API_BASE/pricing/calculate"
echo "• Customer Profile:GET  $API_BASE/customers/profile"
echo "• Create Contract: POST $API_BASE/contracting/draft"
echo ""

echo "🔑 Test Data Examples:"
echo "======================"
echo "Registration (POST $API_BASE/auth/register):"
cat << 'EOF'
{
  "email": "test@example.com",
  "password": "Test123!@#",
  "firstName": "Max",
  "lastName": "Mustermann",
  "street": "Musterstraße",
  "houseNumber": "123",
  "plz": "10115",
  "city": "Berlin",
  "phone": "+49 30 12345678"
}
EOF

echo ""
echo "Price Calculation (POST $API_BASE/pricing/calculate):"
cat << 'EOF'
{
  "plz": "10115",
  "annualConsumption": 3500,
  "householdSize": 3
}
EOF

echo ""
echo -e "${GREEN}🎉 Setup validation complete!${NC}"
echo "For detailed documentation, visit: http://localhost:3000/api-docs"
echo "For support: tech@enfinitus-energie.de"