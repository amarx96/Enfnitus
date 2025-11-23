#!/bin/bash

# EVU Backend Test Environment Startup Script

echo "🚀 Starting EVU Backend Test Environment"
echo "========================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing Test API dependencies..."
cd test-api
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install Test API dependencies"
    exit 1
fi

echo "🔧 Starting Dummy API Server..."
export NODE_ENV=test
export TEST_API_PORT=3001
export JWT_SECRET=test-dummy-api-secret-2024

# Start the API server in background
node server.js &
API_PID=$!

echo "⏳ Waiting for API to be ready..."
sleep 3

# Test if API is responding
for i in {1..10}; do
    if curl -s http://localhost:3001/health > /dev/null; then
        echo "✅ Dummy API is running on http://localhost:3001"
        echo "📋 API Info: http://localhost:3001/info"
        echo "🔍 Health Check: http://localhost:3001/health"
        break
    fi
    
    if [ $i -eq 10 ]; then
        echo "❌ Failed to start Dummy API after 10 attempts"
        kill $API_PID 2>/dev/null
        exit 1
    fi
    
    echo "⏳ Attempt $i/10 - waiting for API..."
    sleep 2
done

echo ""
echo "🤖 Running API Tests..."
node test-api-client.js

TEST_RESULT=$?

echo ""
echo "🧪 Running Integration Tests..."
cd ..
export USE_TEST_API=true
export NODE_ENV=test-integration
npm test -- tests/integration/dummy-api.test.js

INTEGRATION_RESULT=$?

echo ""
echo "📊 Test Results Summary:"
echo "========================"

if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ API Tests: PASSED"
else
    echo "❌ API Tests: FAILED"
fi

if [ $INTEGRATION_RESULT -eq 0 ]; then
    echo "✅ Integration Tests: PASSED"
else
    echo "❌ Integration Tests: FAILED"
fi

echo ""
echo "🔧 Test Environment Status:"
echo "   - Dummy API: Running on http://localhost:3001 (PID: $API_PID)"
echo "   - Database: Mock (in-memory)"
echo "   - JWT Secret: test-dummy-api-secret-2024"
echo ""
echo "To stop the test environment:"
echo "   kill $API_PID"
echo ""
echo "To run integration tests manually:"
echo "   export USE_TEST_API=true"
echo "   export NODE_ENV=test-integration"
echo "   npm test -- tests/integration/dummy-api.test.js"
echo ""

# Keep API running
echo "🎯 Test environment is ready! Press Ctrl+C to stop."
wait $API_PID