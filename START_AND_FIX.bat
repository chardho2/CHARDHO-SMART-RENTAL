@echo off
echo ========================================
echo   CHARDHO GO - Driver Display Fix
echo ========================================
echo.

echo Step 1: Checking if server is running...
netstat -ano | findstr :4000 > nul
if %errorlevel% equ 0 (
    echo [OK] Server is already running on port 4000
) else (
    echo [!] Server is NOT running
    echo.
    echo Starting backend server...
    echo.
    start "Chardho GO Server" cmd /k "cd server && npm start"
    timeout /t 5 /nobreak > nul
)

echo.
echo Step 2: Opening MongoDB Compass instructions...
echo.
echo Please follow these steps in MongoDB Compass:
echo.
echo 1. Open MongoDB Compass
echo 2. Connect to: mongodb://127.0.0.1:27017
echo 3. Select database: chradhogo
echo 4. Select collection: drivers
echo 5. Find your driver and click Edit
echo 6. Set these fields:
echo    - isOnline: true
echo    - isActive: true
echo    - location.latitude: 14.6819
echo    - location.longitude: 77.6006
echo    - location.lastUpdated: (current date)
echo 7. Click Update
echo.

echo Step 3: Opening fix guide...
start FIX_DRIVERS_NOW.md

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Update driver in MongoDB Compass (see above)
echo 2. Refresh your booking page
echo 3. Select a pickup location
echo 4. Drivers should now appear!
echo.
echo If drivers still don't show, check:
echo - Server terminal for logs
echo - Browser console (F12) for errors
echo.
pause
