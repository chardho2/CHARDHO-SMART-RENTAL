const mongoose = require('mongoose');
const Driver = require('../models/Driver');

async function main() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://127.0.0.1:27017/chradhogo');
        console.log('✅ Connected to MongoDB\n');

        console.log('=== DRIVER DISPLAY FIX TOOL ===\n');

        // Step 1: Check all drivers
        const allDrivers = await Driver.find({});
        console.log(`📊 Total drivers in database: ${allDrivers.length}\n`);

        if (allDrivers.length === 0) {
            console.log('⚠️  NO DRIVERS FOUND!');
            console.log('\n📝 TO FIX:');
            console.log('1. Register a driver account at /signup/driver');
            console.log('2. Login to the driver account');
            console.log('3. Toggle "Go Online" in the driver dashboard\n');
            await mongoose.connection.close();
            return;
        }

        // Step 2: Show all drivers
        console.log('=== ALL DRIVERS ===\n');
        for (let i = 0; i < allDrivers.length; i++) {
            const d = allDrivers[i];
            console.log(`${i + 1}. ${d.name} (${d.email})`);
            console.log(`   ID: ${d._id}`);
            console.log(`   Online: ${d.isOnline ? '🟢 YES' : '🔴 NO'}`);
            console.log(`   Active: ${d.isActive ? '✅ YES' : '❌ NO'}`);
            console.log(`   Vehicle: ${d.vehicle?.type || 'Not set'} ${d.vehicle?.model || ''}`);
            console.log(`   Plate: ${d.vehicle?.plateNumber || 'Not set'}`);

            if (d.location?.latitude && d.location?.longitude) {
                console.log(`   Location: ✅ ${d.location.latitude.toFixed(4)}, ${d.location.longitude.toFixed(4)}`);
            } else {
                console.log(`   Location: ❌ NOT SET`);
            }
            console.log('');
        }

        // Step 3: Check online drivers
        const onlineDrivers = allDrivers.filter(d => d.isOnline);
        console.log(`\n🟢 Online drivers: ${onlineDrivers.length}`);
        console.log(`🔴 Offline drivers: ${allDrivers.length - onlineDrivers.length}\n`);

        if (onlineDrivers.length === 0) {
            console.log('⚠️  NO ONLINE DRIVERS!');
            console.log('\n📝 TO FIX:');
            console.log('1. Login to a driver account');
            console.log('2. Go to driver dashboard');
            console.log('3. Toggle the "Go Online" switch');
            console.log('4. Make sure location permissions are granted\n');
            await mongoose.connection.close();
            return;
        }

        // Step 4: Fix online drivers without location
        const driversNeedingFix = onlineDrivers.filter(d => !d.location?.latitude || !d.location?.longitude);

        if (driversNeedingFix.length > 0) {
            console.log(`\n🔧 FIXING ${driversNeedingFix.length} ONLINE DRIVER(S) WITHOUT LOCATION...\n`);

            // Default location: Anantapur, AP
            const defaultLat = 14.6819;
            const defaultLng = 77.6006;

            for (const driver of driversNeedingFix) {
                console.log(`Fixing: ${driver.name}`);
                driver.location = {
                    latitude: defaultLat,
                    longitude: defaultLng,
                    lastUpdated: new Date()
                };
                await driver.save();
                console.log(`  ✅ Set location to Anantapur (${defaultLat}, ${defaultLng})\n`);
            }
        } else {
            console.log('✅ All online drivers have location data!\n');
        }

        // Step 5: Final summary
        console.log('\n=== FINAL STATUS ===\n');
        const updatedOnline = await Driver.find({ isOnline: true });
        const withLocation = updatedOnline.filter(d => d.location?.latitude && d.location?.longitude);

        console.log(`Total drivers: ${allDrivers.length}`);
        console.log(`Online drivers: ${updatedOnline.length}`);
        console.log(`Online with location: ${withLocation.length}\n`);

        if (withLocation.length > 0) {
            console.log('✅ SUCCESS! Drivers should now be visible in booking page!\n');
            console.log('Online drivers with location:');
            withLocation.forEach((d, i) => {
                console.log(`  ${i + 1}. ${d.name} - ${d.vehicle?.type || 'N/A'} (${d.location.latitude.toFixed(4)}, ${d.location.longitude.toFixed(4)})`);
            });
            console.log('');
        } else {
            console.log('⚠️  Still no online drivers with location!');
            console.log('Please ensure drivers are logged in and online.\n');
        }

        await mongoose.connection.close();
        console.log('Database connection closed.');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

main();
