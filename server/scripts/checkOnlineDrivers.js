const mongoose = require('mongoose');
const Driver = require('../models/Driver');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/chradhogo')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

async function checkOnlineDrivers() {
    try {
        console.log('\n=== CHECKING ONLINE DRIVERS ===\n');

        // Get all online drivers
        const onlineDrivers = await Driver.find({ isOnline: true });
        console.log(`Total online drivers: ${onlineDrivers.length}\n`);

        if (onlineDrivers.length === 0) {
            console.log('⚠️ No drivers are currently online!');
            console.log('\nTo test multiple drivers:');
            console.log('1. Register multiple driver accounts');
            console.log('2. Login to each driver account');
            console.log('3. Toggle "Go Online" in the driver dashboard');
            console.log('4. Ensure location permissions are granted\n');
        } else {
            onlineDrivers.forEach((driver, index) => {
                console.log(`Driver ${index + 1}:`);
                console.log(`  Name: ${driver.name}`);
                console.log(`  Email: ${driver.email}`);
                console.log(`  ID: ${driver._id}`);
                console.log(`  Online: ${driver.isOnline}`);
                console.log(`  Active: ${driver.isActive}`);
                console.log(`  Vehicle: ${driver.vehicle?.type} ${driver.vehicle?.model} (${driver.vehicle?.plateNumber})`);
                console.log(`  Location: ${driver.location?.latitude ? `${driver.location.latitude}, ${driver.location.longitude}` : '❌ NO LOCATION'}`);
                console.log(`  Last Updated: ${driver.location?.lastUpdated || 'Never'}`);
                console.log('');
            });
        }

        // Check all drivers (online and offline)
        const allDrivers = await Driver.find({});
        console.log(`\nTotal drivers in database: ${allDrivers.length}`);

        const offlineDrivers = allDrivers.filter(d => !d.isOnline);
        console.log(`Offline drivers: ${offlineDrivers.length}`);

        if (offlineDrivers.length > 0) {
            console.log('\nOffline drivers:');
            offlineDrivers.forEach((driver, index) => {
                console.log(`  ${index + 1}. ${driver.name} (${driver.email})`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

checkOnlineDrivers();
