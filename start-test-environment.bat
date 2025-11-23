@echo off
REM EVU Backend Test Environment Startup Script for Windows

echo 🚀 Starting EVU Backend Test Environment
echo ========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 14+ first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo 📦 Installing Test API dependencies...
cd test-api
call npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install Test API dependencies
    pause
    exit /b 1
)

echo 🔧 Starting Dummy API Server...
set NODE_ENV=test
set TEST_API_PORT=3001
set JWT_SECRET=test-dummy-api-secret-2024

REM Start the API server in background
start /b node server.js

echo ⏳ Waiting for API to be ready...
timeout /t 3 /nobreak >nul

REM Test if API is responding
for /l %%i in (1,1,10) do (
    curl -s http://localhost:3001/health >nul 2>&1
    if !errorlevel! equ 0 (
        echo ✅ Dummy API is running on http://localhost:3001
        echo 📋 API Info: http://localhost:3001/info
        echo 🔍 Health Check: http://localhost:3001/health
        goto :api_ready
    )
    
    echo ⏳ Attempt %%i/10 - waiting for API...
    timeout /t 2 /nobreak >nul
)

echo ❌ Failed to start Dummy API after 10 attempts
pause
exit /b 1

:api_ready
echo.
echo 🤖 Running API Tests...
node test-api-client.js

set TEST_RESULT=%errorlevel%

echo.
echo 🧪 Running Integration Tests...
cd ..
set USE_TEST_API=true
set NODE_ENV=test-integration
call npm test -- tests/integration/dummy-api.test.js

set INTEGRATION_RESULT=%errorlevel%

echo.
echo 📊 Test Results Summary:
echo ========================

if %TEST_RESULT% equ 0 (
    echo ✅ API Tests: PASSED
) else (
    echo ❌ API Tests: FAILED
)

if %INTEGRATION_RESULT% equ 0 (
    echo ✅ Integration Tests: PASSED
) else (
    echo ❌ Integration Tests: FAILED
)

echo.
echo 🔧 Test Environment Status:
echo    - Dummy API: Running on http://localhost:3001
echo    - Database: Mock (in-memory)
echo    - JWT Secret: test-dummy-api-secret-2024
echo.
echo To stop the test environment:
echo    - Close this window or press Ctrl+C
echo.
echo To run integration tests manually:
echo    set USE_TEST_API=true
echo    set NODE_ENV=test-integration
echo    npm test -- tests/integration/dummy-api.test.js
echo.

echo 🎯 Test environment is ready! Press any key to stop.
pause >nul