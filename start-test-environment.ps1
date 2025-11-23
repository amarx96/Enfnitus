#!/usr/bin/env pwsh

Write-Host "🚀 Starting EVU Backend Test Environment" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Set environment variables
$env:NODE_ENV = "test"
$env:TEST_API_PORT = "3001"
$env:JWT_SECRET = "test-dummy-api-secret-2024"

# Change to test-api directory
Set-Location "C:\Users\alex-\Desktop\EVU_Backend\test-api"

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "🔧 Starting Dummy API Server..." -ForegroundColor Yellow

# Kill any existing process on port 3001
$process = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($process) {
    $pid = (Get-Process -Id $process.OwningProcess -ErrorAction SilentlyContinue).Id
    if ($pid) {
        Stop-Process -Id $pid -Force
        Write-Host "🔪 Killed existing process on port 3001" -ForegroundColor Yellow
    }
}

Write-Host "⚡ Starting server on port 3001..." -ForegroundColor Green

# Start the server
Start-Job -ScriptBlock {
    Set-Location "C:\Users\alex-\Desktop\EVU_Backend\test-api"
    $env:NODE_ENV = "test"
    $env:TEST_API_PORT = "3001"
    $env:JWT_SECRET = "test-dummy-api-secret-2024"
    node server.js
} -Name "DummyAPIServer"

# Wait for server to start
Start-Sleep -Seconds 5

# Test if server is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Dummy API is running on http://localhost:3001" -ForegroundColor Green
    Write-Host "📋 API Info: http://localhost:3001/info" -ForegroundColor Cyan
    Write-Host "🔍 Health Check: http://localhost:3001/health" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to start Dummy API" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Get-Job -Name "DummyAPIServer" | Remove-Job -Force
    exit 1
}

Write-Host ""
Write-Host "🤖 Running API Tests..." -ForegroundColor Yellow
node test-api-client.js

Write-Host ""
Write-Host "🧪 Running Integration Tests..." -ForegroundColor Yellow
Set-Location "C:\Users\alex-\Desktop\EVU_Backend"
$env:USE_TEST_API = "true"
$env:NODE_ENV = "test-integration"

# Check if npm test command exists
if (Test-Path "package.json") {
    npm test -- tests/integration/dummy-api.test.js
} else {
    Write-Host "⚠️  No package.json found for integration tests" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 Test Environment Status:" -ForegroundColor Green
Write-Host "   - Dummy API: Running on http://localhost:3001" -ForegroundColor Cyan
Write-Host "   - Database: Mock (in-memory)" -ForegroundColor Cyan
Write-Host "   - JWT Secret: test-dummy-api-secret-2024" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop the test environment:" -ForegroundColor Yellow
Write-Host "   Get-Job -Name 'DummyAPIServer' | Stop-Job | Remove-Job" -ForegroundColor Gray
Write-Host ""

# Keep server running
Write-Host "🎯 Test environment is ready! Press Ctrl+C to stop." -ForegroundColor Green
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
} finally {
    Write-Host "🛑 Stopping test environment..." -ForegroundColor Yellow
    Get-Job -Name "DummyAPIServer" -ErrorAction SilentlyContinue | Stop-Job | Remove-Job
    Write-Host "✅ Test environment stopped." -ForegroundColor Green
}