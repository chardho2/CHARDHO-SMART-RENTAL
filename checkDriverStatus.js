const mongoose = require('mongoose');
const path = require('path');

// Load Driver model
const Driver = require('./server/models/Driver');

async function checkDriverStatus() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb://127.0.0.1:27017/chradhogo');
        console.log('✅ Connected!\n');

        console.log('=== DRIVER STATUS CHECK ===\n');

        const allDrivers = await Driver.find({});
        console.log(`Total drivers in database: ${allDrivers.length}\n`);

        if (allDrivers.length === 0) {
            console.log('❌ NO DRIVERS FOUND!');
            console.log('\nPlease register a driver account first.');
            console.log('Visit: http://localhost:3000/signup/driver\n');
            return;
        }

        console.log('All Drivers:\n');
        allDrivers.forEach((driver, index) => {
            console.log(`${index + 1}. ${driver.name}`);
            console.log(`   Email: ${driver.email}`);
            console.log(`   ID: ${driver._id}`);
            console.log(`   Online: ${driver.isOnline ? '🟢 YES' : '🔴 NO'}`);
            console.log(`   Active: ${driver.isActive ? '✅' : '❌'}`);
            console.log(`   Vehicle: ${driver.vehicle?.type || 'Not set'} - ${driver.vehicle?.model || 'N/A'}`);
            console.log(`   Plate: ${driver.vehicle?.plateNumber || 'Not set'}`);

            if (driver.location?.latitude && driver.location?.longitude) {
                console.log(`   Location: ✅ (${driver.location.latitude.toFixed(4)}, ${driver.location.longitude.toFixed(4)})`);
                console.log(`   Last Updated: ${driver.location.lastUpdated || 'Unknown'}`);
            } else {
                console.log(`   Location: ❌ NOT SET`);
            }
            console.log('');
        });

        const onlineDrivers = allDrivers.filter(d => d.isOnline);
        const onlineWithLocation = onlineDrivers.filter(d => d.location?.latitude && d.location?.longitude);

        console.log('\n=== SUMMARY ===');
        console.log(`Total: ${allDrivers.length}`);
        console.log(`Online: ${onlineDrivers.length}`);
        console.log(`Online with Location: ${onlineWithLocation.length}`);

        if (onlineWithLocation.length > 0) {
            console.log('\n✅ These drivers should be visible in the booking page!');
        } else if (onlineDrivers.length > 0) {
            console.log('\n⚠️  Drivers are online but missing location data.');
            console.log('Run: node setDriverLocation.js');
        } else {
            console.log('\n⚠️  No drivers are online.');
            console.log('Please login to a driver account and toggle "Go Online".');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
    }
}

checkDriverStatus();
