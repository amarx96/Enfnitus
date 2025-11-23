@echo off
echo ========================================
echo Starting EVU Complete System (Rabot Model)
echo ========================================

echo 1. Starting Backend (Port 3000)...
start "EVU Backend" cmd /k "cd /d %~dp0 && node src/server.js"

echo Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

echo 2. Starting Enfinitus Frontend (Chakra UI) (Port 3001)...
start "Enfinitus Frontend" cmd /k "cd /d %~dp0frontend-chakra && npm start"

echo 3. Starting Viet Energie Frontend (Port 3002)...
start "Viet Energie Frontend" cmd /k "cd /d %~dp0frontend-viet && npm start"

echo.
echo ========================================
echo System is starting up!
echo ========================================
echo Backend API:      http://localhost:3000
echo Enfinitus:        http://localhost:3001
echo Viet Energie:     http://localhost:3002
echo API Documentation: http://localhost:3000/api-docs
echo.
echo Please ensure you have configured your .env file!
echo Press any key to close this launcher window...
pause > nul