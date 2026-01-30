// Quick script to check driver status in database
// Run with: node backend/scripts/checkDriver.js

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkDrivers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all users with driver role or userType
        const drivers = await User.find({
            $or: [
                { role: 'driver' },
                { userType: 'driver' }
            ]
        }).select('name email role userType isOnline isAvailable vehicle');

        console.log(`📊 Total drivers in database: ${drivers.length}\n`);

        if (drivers.length === 0) {
            console.log('⚠️  No drivers found in database!');
            console.log('   Please register a driver account first.\n');
        } else {
            drivers.forEach((driver, index) => {
                console.log(`Driver ${index + 1}:`);
                console.log(`  Name: ${driver.name}`);
                console.log(`  Email: ${driver.email}`);
                console.log(`  Role: ${driver.role}`);
                console.log(`  UserType: ${driver.userType}`);
                console.log(`  Is Online: ${driver.isOnline ? '✅ YES' : '❌ NO'}`);
                console.log(`  Is Available: ${driver.isAvailable ? '✅ YES' : '❌ NO'}`);
                console.log(`  Vehicle Type: ${driver.vehicle?.type || '❌ NOT SET'}`);
                console.log(`  Vehicle Model: ${driver.vehicle?.model || '❌ NOT SET'}`);
                console.log(`  Vehicle Plate: ${driver.vehicle?.plateNumber || '❌ NOT SET'}`);

                // Check issues
                const issues = [];
                if (!driver.isOnline) issues.push('Driver is OFFLINE');
                if (!driver.vehicle?.type) issues.push('Vehicle type NOT SET');
                if (driver.role !== 'driver' && driver.userType !== 'driver') {
                    issues.push('Neither role nor userType is "driver"');
                }

                if (issues.length > 0) {
                    console.log(`  ⚠️  Issues:`);
                    issues.forEach(issue => console.log(`     - ${issue}`));
                }
                console.log('');
            });

            // Check online drivers
            const onlineDrivers = drivers.filter(d => d.isOnline);
            console.log(`\n📊 Summary:`);
            console.log(`   Total Drivers: ${drivers.length}`);
            console.log(`   Online Drivers: ${onlineDrivers.length}`);
            console.log(`   Offline Drivers: ${drivers.length - onlineDrivers.length}`);

            const driversWithVehicle = drivers.filter(d => d.vehicle?.type);
            console.log(`   Drivers with Vehicle: ${driversWithVehicle.length}`);
            console.log(`   Drivers without Vehicle: ${drivers.length - driversWithVehicle.length}`);

            // Show what query would find
            console.log(`\n🔍 Available Drivers Query Test:`);
            const availableDrivers = await User.find({
                $or: [
                    { role: 'driver' },
                    { userType: 'driver' }
                ],
                isOnline: true
            });
            console.log(`   Drivers that would show in booking: ${availableDrivers.length}`);

            if (availableDrivers.length === 0) {
                console.log(`\n❌ NO DRIVERS WOULD SHOW IN BOOKING!`);
                console.log(`   Reasons:`);
                if (onlineDrivers.length === 0) {
                    console.log(`   - No drivers are online`);
                    console.log(`   - Solution: Go to driver dashboard and toggle online`);
                }
            } else {
                console.log(`\n✅ These drivers would show in booking:`);
                availableDrivers.forEach((d, i) => {
                    console.log(`   ${i + 1}. ${d.name} (${d.vehicle?.type || 'no vehicle'})`);
                });
            }
        }

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkDrivers();
