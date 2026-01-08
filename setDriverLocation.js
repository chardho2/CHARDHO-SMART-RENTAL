const mongoose = require('mongoose');
const Driver = require('./server/models/Driver');

async function setDriverLocation() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb://127.0.0.1:27017/chradhogo');
        console.log('✅ Connected!\n');

        console.log('=== SET DRIVER LOCATION ===\n');

        // Find online drivers without location
        const onlineDrivers = await Driver.find({ isOnline: true });

        if (onlineDrivers.length === 0) {
            console.log('❌ No online drivers found!');
            console.log('Please login to a driver account and toggle "Go Online" first.\n');
            return;
        }

        console.log(`Found ${onlineDrivers.length} online driver(s)\n`);

        const driversNeedingLocation = onlineDrivers.filter(d =>
            !d.location?.latitude || !d.location?.longitude
        );

        if (driversNeedingLocation.length === 0) {
            console.log('✅ All online drivers already have location data!');
            console.log('\nOnline drivers with location:');
            onlineDrivers.forEach((d, i) => {
                console.log(`${i + 1}. ${d.name} - (${d.location.latitude.toFixed(4)}, ${d.location.longitude.toFixed(4)})`);
            });
            return;
        }

        console.log(`Setting location for ${driversNeedingLocation.length} driver(s)...\n`);

        // Default location: Anantapur, Andhra Pradesh
        const defaultLocation = {
            latitude: 14.6819,
            longitude: 77.6006,
            lastUpdated: new Date()
        };

        for (const driver of driversNeedingLocation) {
            console.log(`Setting location for: ${driver.name}`);
            driver.location = defaultLocation;
            await driver.save();
            console.log(`  ✅ Location set to Anantapur (${defaultLocation.latitude}, ${defaultLocation.longitude})`);
        }

        console.log(`\n✅ Successfully set location for ${driversNeedingLocation.length} driver(s)!`);
        console.log('\nDrivers should now be visible in the booking page.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

setDriverLocation();
