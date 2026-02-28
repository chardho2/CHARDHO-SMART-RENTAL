const mongoose = require('mongoose');
const Driver = require('../models/Driver');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/chradhogo')
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    });

async function fixDriverDisplay() {
    try {
        console.log('\n=== FIXING DRIVER DISPLAY ISSUE ===\n');

        // Get all drivers
        const allDrivers = await Driver.find({});
        console.log(`📊 Total drivers in database: ${allDrivers.length}\n`);

        if (allDrivers.length === 0) {
            console.log('⚠️ No drivers found in database!');
            console.log('Please register a driver account first.\n');
            return;
        }

        // Check online drivers
        const onlineDrivers = allDrivers.filter(d => d.isOnline);
        console.log(`🟢 Online drivers: ${onlineDrivers.length}`);
        console.log(`🔴 Offline drivers: ${allDrivers.length - onlineDrivers.length}\n`);

        // Display each driver's status
        console.log('=== DRIVER STATUS ===\n');
        allDrivers.forEach((driver, index) => {
            console.log(`Driver ${index + 1}:`);
            console.log(`  Name: ${driver.name}`);
            console.log(`  Email: ${driver.email}`);
            console.log(`  ID: ${driver._id}`);
            console.log(`  Online: ${driver.isOnline ? '🟢 YES' : '🔴 NO'}`);
            console.log(`  Active: ${driver.isActive ? '✅ YES' : '❌ NO'}`);
            console.log(`  Vehicle: ${driver.vehicle?.type || 'N/A'} ${driver.vehicle?.model || ''} (${driver.vehicle?.plateNumber || 'N/A'})`);

            if (driver.location?.latitude && driver.location?.longitude) {
                console.log(`  Location: ✅ ${driver.location.latitude.toFixed(4)}, ${driver.location.longitude.toFixed(4)}`);
                console.log(`  Last Updated: ${driver.location.lastUpdated || 'Never'}`);
            } else {
                console.log(`  Location: ❌ NO LOCATION DATA`);
            }
            console.log('');
        });

        // Fix: Set a default location for online drivers without GPS
        console.log('\n=== FIXING ONLINE DRIVERS WITHOUT LOCATION ===\n');

        const driversToFix = onlineDrivers.filter(d => !d.location?.latitude || !d.location?.longitude);

        if (driversToFix.length === 0) {
            console.log('✅ All online drivers have location data!\n');
        } else {
            console.log(`Found ${driversToFix.length} online driver(s) without location data\n`);

            // Anantapur coordinates as default
            const defaultLocation = {
                latitude: 14.6819,
                longitude: 77.6006,
                lastUpdated: new Date()
            };

            for (const driver of driversToFix) {
                console.log(`Fixing ${driver.name}...`);
                driver.location = defaultLocation;
                await driver.save();
                console.log(`  ✅ Set default location (Anantapur)`);
            }

            console.log(`\n✅ Fixed ${driversToFix.length} driver(s)\n`);
        }

        // Summary
        console.log('\n=== SUMMARY ===\n');
        const updatedOnlineDrivers = await Driver.find({ isOnline: true });
        const driversWithLocation = updatedOnlineDrivers.filter(d => d.location?.latitude && d.location?.longitude);

        console.log(`Total drivers: ${allDrivers.length}`);
        console.log(`Online drivers: ${updatedOnlineDrivers.length}`);
        console.log(`Online drivers with location: ${driversWithLocation.length}`);
        console.log(`\n${driversWithLocation.length > 0 ? '✅ Drivers should now be visible in the booking page!' : '⚠️ No online drivers with location found'}\n`);

        // If no online drivers, provide instructions
        if (updatedOnlineDrivers.length === 0) {
            console.log('📝 TO FIX:');
            console.log('1. Login to a driver account');
            console.log('2. Toggle "Go Online" in the driver dashboard');
            console.log('3. Ensure location permissions are granted');
            console.log('4. Run this script again\n');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed.');
    }
}

fixDriverDisplay();
