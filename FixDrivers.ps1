# PowerShell script to fix driver display issue
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CHARDHO GO - Driver Fix Tool" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if server is running
Write-Host "Checking backend server..." -ForegroundColor Yellow
$serverRunning = Test-NetConnection -ComputerName localhost -Port 4000 -InformationLevel Quiet -WarningAction SilentlyContinue

if ($serverRunning) {
    Write-Host "[OK] Server is running on port 4000" -ForegroundColor Green
} else {
    Write-Host "[!] Server is NOT running" -ForegroundColor Red
    Write-Host ""
    Write-Host "Starting server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd server; npm start"
    Write-Host "Waiting for server to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MANUAL FIX REQUIRED" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "To make drivers visible, you need to update MongoDB:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Using MongoDB Compass (Recommended)" -ForegroundColor Green
Write-Host "  1. Open MongoDB Compass" -ForegroundColor White
Write-Host "  2. Connect to: mongodb://127.0.0.1:27017" -ForegroundColor White
Write-Host "  3. Database: chradhogo" -ForegroundColor White
Write-Host "  4. Collection: drivers" -ForegroundColor White
Write-Host "  5. Find your driver and click 'Edit'" -ForegroundColor White
Write-Host "  6. Update these fields:" -ForegroundColor White
Write-Host "     - isOnline: true" -ForegroundColor Cyan
Write-Host "     - isActive: true" -ForegroundColor Cyan
Write-Host "     - location.latitude: 14.6819" -ForegroundColor Cyan
Write-Host "     - location.longitude: 77.6006" -ForegroundColor Cyan
Write-Host "     - location.lastUpdated: (current date/time)" -ForegroundColor Cyan
Write-Host "  7. Click 'Update'" -ForegroundColor White
Write-Host ""

Write-Host "Option 2: Using MongoDB Shell" -ForegroundColor Green
Write-Host "  Run this command in mongo/mongosh:" -ForegroundColor White
Write-Host ""
Write-Host "  use chradhogo" -ForegroundColor Cyan
Write-Host "  db.drivers.updateOne(" -ForegroundColor Cyan
Write-Host "    { email: 'YOUR_DRIVER_EMAIL' }," -ForegroundColor Cyan
Write-Host "    { `$set: {" -ForegroundColor Cyan
Write-Host "      isOnline: true," -ForegroundColor Cyan
Write-Host "      isActive: true," -ForegroundColor Cyan
Write-Host "      location: {" -ForegroundColor Cyan
Write-Host "        latitude: 14.6819," -ForegroundColor Cyan
Write-Host "        longitude: 77.6006," -ForegroundColor Cyan
Write-Host "        lastUpdated: new Date()" -ForegroundColor Cyan
Write-Host "      }" -ForegroundColor Cyan
Write-Host "    }}" -ForegroundColor Cyan
Write-Host "  )" -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "After updating MongoDB:" -ForegroundColor Yellow
Write-Host "  1. Refresh the booking page" -ForegroundColor White
Write-Host "  2. Select a pickup location" -ForegroundColor White
Write-Host "  3. Drivers should appear in 'Available Drivers Nearby'" -ForegroundColor White
Write-Host ""
Write-Host "Check server logs for:" -ForegroundColor Yellow
Write-Host "  'Driver Collection: Found X online'" -ForegroundColor White
Write-Host ""

Write-Host "Press any key to open the detailed fix guide..." -ForegroundColor Green
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Open the fix guide
Start-Process "FIX_DRIVERS_NOW.md"

Write-Host ""
Write-Host "Good luck! 🚗" -ForegroundColor Green
