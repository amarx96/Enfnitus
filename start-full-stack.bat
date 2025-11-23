@echo off
echo ========================================
echo Starting EVU Backend and Frontend
echo ========================================

echo Starting EVU Backend Server...
start "EVU Backend" cmd /k "cd /d %~dp0 && node src/server.js"

echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo Starting EVU Frontend...
start "EVU Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo ========================================
echo Both services are starting...
echo ========================================
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3001
echo API Docs: http://localhost:3000/api-docs
echo.
echo Press any key to close this window...
pause > nul