# Quick Driver Fix Script
# This script checks MongoDB and sets a driver online with location

Write-Host "`n=== DRIVER FIX SCRIPT ===" -ForegroundColor Cyan
Write-Host "This will check and fix driver data in MongoDB`n" -ForegroundColor Yellow

# Check if MongoDB is running
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
$mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
if ($mongoProcess) {
    Write-Host "✅ MongoDB is running" -ForegroundColor Green
} else {
    Write-Host "❌ MongoDB is NOT running!" -ForegroundColor Red
    Write-Host "Please start MongoDB first." -ForegroundColor Yellow
    exit 1
}

# Create a temporary JavaScript file to run
$scriptContent = @"
const mongoose = require('mongoose');

async function fixDriver() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/chradhogo');
        console.log('✅ Connected to MongoDB\n');

        const Driver = require('./server/models/Driver');
        
        // Get all drivers
        const allDrivers = await Driver.find({});
        console.log('📊 Total drivers:', allDrivers.length);
        
        if (allDrivers.length === 0) {
            console.log('❌ No drivers found in database!');
            console.log('Please register a driver first.');
            await mongoose.disconnect();
            process.exit(1);
        }

        // Show all drivers
        console.log('\n=== ALL DRIVERS ===');
        allDrivers.forEach((d, i) => {
            console.log(`${i + 1}. ${d.name} (${d.email})`);
            console.log(`   Online: ${d.isOnline ? '🟢' : '🔴'}`);
            console.log(`   Location: ${d.location?.latitude ? '✅' : '❌'}`);
        });

        // Get the first driver (or you can modify this to select a specific one)
        const driver = allDrivers[0];
        console.log(`\n🔧 Fixing driver: ${driver.name}`);

        // Update the driver
        driver.isOnline = true;
        driver.isActive = true;
        driver.location = {
            latitude: 14.6819,
            longitude: 77.6006,
            lastUpdated: new Date()
        };
        
        if (!driver.vehicle || !driver.vehicle.type) {
            driver.vehicle = {
                type: 'bike',
                model: 'Honda',
                plateNumber: 'AP01XX1234',
                color: 'Black'
            };
        }

        await driver.save();
        
        console.log('\n✅ Driver updated successfully!');
        console.log('   Name:', driver.name);
        console.log('   Online:', driver.isOnline);
        console.log('   Location:', driver.location.latitude + ', ' + driver.location.longitude);
        console.log('   Vehicle:', driver.vehicle.type);
        
        console.log('\n🎉 Driver should now appear in the app!');
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixDriver();
"@

# Write the script to a temp file
$tempScript = Join-Path $PSScriptRoot "temp_fix_driver.js"
$scriptContent | Out-File -FilePath $tempScript -Encoding UTF8

Write-Host "`nRunning fix script..." -ForegroundColor Yellow

# Run the script
try {
    node $tempScript
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host "`n✅ SUCCESS! Driver has been set online." -ForegroundColor Green
        Write-Host "`nNext steps:" -ForegroundColor Cyan
        Write-Host "1. Make sure backend server is running: cd server && npm start" -ForegroundColor White
        Write-Host "2. Refresh your booking page" -ForegroundColor White
        Write-Host "3. Select a pickup location" -ForegroundColor White
        Write-Host "4. Driver should now appear!" -ForegroundColor White
    } else {
        Write-Host "`n❌ Script failed. Check the error above." -ForegroundColor Red
    }
} catch {
    Write-Host "`n❌ Error running script: $_" -ForegroundColor Red
} finally {
    # Clean up temp file
    if (Test-Path $tempScript) {
        Remove-Item $tempScript -Force
    }
}

Write-Host ""
