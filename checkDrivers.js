const mongoose = require('mongoose');

async function checkDrivers() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/chradhogo');
        console.log('✅ Connected to MongoDB\n');

        const Driver = require('./models/Driver');

        // Get all drivers
        const allDrivers = await Driver.find({});
        console.log(`📊 Total drivers in database: ${allDrivers.length}\n`);

        // Get online drivers
        const onlineDrivers = await Driver.find({ isOnline: true });
        console.log(`🟢 Online drivers: ${onlineDrivers.length}\n`);

        // Show details of each driver
        console.log('=== DRIVER DETAILS ===\n');
        for (const driver of allDrivers) {
            console.log(`👤 ${driver.name} (${driver.email})`);
            console.log(`   ID: ${driver._id}`);
            console.log(`   Online: ${driver.isOnline ? '🟢 YES' : '🔴 NO'}`);
            console.log(`   Active: ${driver.isActive ? '✅ YES' : '❌ NO'}`);

            if (driver.location?.latitude && driver.location?.longitude) {
                console.log(`   Location: ✅ ${driver.location.latitude}, ${driver.location.longitude}`);
                console.log(`   Last Updated: ${driver.location.lastUpdated || 'Never'}`);
            } else {
                console.log(`   Location: ❌ NOT SET`);
            }

            if (driver.vehicle?.type) {
                console.log(`   Vehicle: ${driver.vehicle.type} - ${driver.vehicle.model || 'N/A'} (${driver.vehicle.plateNumber || 'N/A'})`);
            } else {
                console.log(`   Vehicle: ❌ NOT SET`);
            }

            console.log('');
        }

        // Check if any driver is ready to be shown
        console.log('\n=== DRIVERS READY TO SHOW ===');
        const readyDrivers = allDrivers.filter(d =>
            d.isOnline &&
            d.location?.latitude &&
            d.location?.longitude
        );

        if (readyDrivers.length > 0) {
            console.log(`✅ ${readyDrivers.length} driver(s) should appear in the app:`);
            readyDrivers.forEach(d => {
                console.log(`   - ${d.name} (${d.vehicle?.type || 'no vehicle type'})`);
            });
        } else {
            console.log('❌ NO drivers are ready to show!');
            console.log('\nReasons:');

            const offlineDrivers = allDrivers.filter(d => !d.isOnline);
            if (offlineDrivers.length > 0) {
                console.log(`   - ${offlineDrivers.length} driver(s) are OFFLINE`);
            }

            const noLocationDrivers = allDrivers.filter(d =>
                d.isOnline && (!d.location?.latitude || !d.location?.longitude)
            );
            if (noLocationDrivers.length > 0) {
                console.log(`   - ${noLocationDrivers.length} online driver(s) have NO LOCATION SET`);
                noLocationDrivers.forEach(d => console.log(`     • ${d.name}`));
            }
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkDrivers();
