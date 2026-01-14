@echo off
echo ========================================
echo Chardho GO - Expo App Launcher
echo ========================================
echo.

echo Checking if you're in the correct directory...
if not exist "package.json" (
    echo ERROR: package.json not found!
    echo Please run this script from the my-app directory
    echo.
    echo Usage: cd my-app
    echo        start-expo.bat
    pause
    exit /b 1
)

echo.
echo Select how you want to start the app:
echo.
echo 1. Normal mode (same WiFi required)
echo 2. Tunnel mode (works across networks - RECOMMENDED)
echo 3. Clear cache and start
echo 4. Web browser only
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Starting Expo in normal mode...
    echo Make sure your phone and computer are on the SAME WiFi network!
    echo.
    npx expo start
) else if "%choice%"=="2" (
    echo.
    echo Starting Expo in tunnel mode...
    echo This may take 30-60 seconds to connect...
    echo Works even if phone and computer are on different networks!
    echo.
    npx expo start --tunnel
) else if "%choice%"=="3" (
    echo.
    echo Clearing cache and starting...
    npx expo start -c
) else if "%choice%"=="4" (
    echo.
    echo Starting web version...
    echo This will open in your browser
    echo.
    npm run web
) else (
    echo.
    echo Invalid choice. Please run the script again.
    pause
    exit /b 1
)

pause
