@echo off
echo.
echo ===================================================
echo   Enfinitus Energie - Frontend Auswahl
echo ===================================================
echo.
echo   Welches Frontend möchten Sie starten?
echo.
echo   1) Original Frontend (Material-UI, Port 3000)
echo   2) Chakra UI Frontend (Modern, weiß-grün, Port 3001)
echo   3) Beide Frontends starten
echo.
set /p choice="Ihre Auswahl (1-3): "

if "%choice%"=="1" (
    echo.
    echo Starte Original Frontend auf Port 3000...
    cd /d "C:\Users\alex-\Desktop\EVU_Backend\frontend"
    npm start
) else if "%choice%"=="2" (
    echo.
    echo Starte Chakra UI Frontend auf Port 3001...
    cd /d "C:\Users\alex-\Desktop\EVU_Backend\frontend-chakra"
    npm start
) else if "%choice%"=="3" (
    echo.
    echo Starte beide Frontends...
    echo Original Frontend: http://localhost:3000
    echo Chakra UI Frontend: http://localhost:3001
    echo.
    start cmd /k "cd /d C:\Users\alex-\Desktop\EVU_Backend\frontend && npm start"
    start cmd /k "cd /d C:\Users\alex-\Desktop\EVU_Backend\frontend-chakra && npm start"
    echo Beide Frontends werden in separaten Fenstern gestartet.
) else (
    echo.
    echo Ungültige Auswahl. Bitte wählen Sie 1, 2 oder 3.
    pause
    goto :start
)

pause