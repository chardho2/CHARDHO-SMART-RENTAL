// Quick script to check specific driver by ID
// Run with: node backend/scripts/checkSpecificDriver.js

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Driver = require('../models/Driver');
const User = require('../models/User');

const DRIVER_ID = '69425288d9b2048c6a053a78'; // Your driver ID

async function checkDriver() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        console.log('🔍 Searching for driver ID:', DRIVER_ID);
        console.log('═'.repeat(80));

        // Check Driver collection
        console.log('\n📋 Checking Driver Collection...');
        const driver = await Driver.findById(DRIVER_ID);

        if (driver) {
            console.log('✅ FOUND in Driver collection!\n');
            console.log('Driver Details:');
            console.log('─'.repeat(80));
            console.log('Name:', driver.name);
            console.log('Email:', driver.email);
            console.log('Phone:', driver.phone);
            console.log('Online:', driver.isOnline ? '✅ YES' : '❌ NO');
            console.log('Active:', driver.isActive ? '✅ YES' : '❌ NO');
            console.log('\nVehicle:');
            console.log('  Type:', driver.vehicle?.type || '❌ NOT SET');
            console.log('  Model:', driver.vehicle?.model || '❌ NOT SET');
            console.log('  Plate:', driver.vehicle?.plateNumber || '❌ NOT SET');
            console.log('\nLocation:');
            if (driver.location?.latitude && driver.location?.longitude) {
                console.log('  GPS: ✅', `(${driver.location.latitude}, ${driver.location.longitude})`);
            } else {
                console.log('  GPS: ❌ NOT SET');
            }
            console.log('\nRating:', driver.rating || 0);
            console.log('Total Rides:', driver.totalRides || 0);
            console.log('\n✅ This driver should be able to toggle online/offline status!');
        } else {
            console.log('❌ NOT FOUND in Driver collection');
        }

        // Check User collection
        console.log('\n📋 Checking User Collection...');
        const user = await User.findById(DRIVER_ID);

        if (user) {
            console.log('✅ FOUND in User collection!\n');
            console.log('User Details:');
            console.log('─'.repeat(80));
            console.log('Name:', user.name);
            console.log('Email:', user.email);
            console.log('Phone:', user.phone);
            console.log('Role:', user.role || 'NOT SET');
            console.log('UserType:', user.userType || 'NOT SET');
            console.log('Online:', user.isOnline ? '✅ YES' : '❌ NO');

            if (user.role === 'driver' || user.userType === 'driver') {
                console.log('\n✅ This is a driver in User collection (legacy)');
                console.log('⚠️  Consider migrating to Driver collection');
            } else {
                console.log('\n❌ This is NOT a driver (role/userType not set)');
            }
        } else {
            console.log('❌ NOT FOUND in User collection');
        }

        // Summary
        console.log('\n' + '═'.repeat(80));
        console.log('SUMMARY');
        console.log('═'.repeat(80));

        if (driver) {
            console.log('✅ Driver exists in Driver collection');
            console.log('✅ Status toggle should work!');
            console.log('\nNext steps:');
            console.log('1. Make sure backend is running');
            console.log('2. Try toggling online/offline in the app');
            console.log('3. Check backend console for success message');
        } else if (user && (user.role === 'driver' || user.userType === 'driver')) {
            console.log('✅ Driver exists in User collection (legacy)');
            console.log('✅ Status toggle should work!');
            console.log('\nRecommendation:');
            console.log('Run migration script to move to Driver collection:');
            console.log('  node backend/scripts/migrateToSeparateCollections.js');
        } else if (user) {
            console.log('❌ User exists but is NOT a driver');
            console.log('\nProblem: User needs to be registered as a driver');
            console.log('Solution: Register through driver signup page');
        } else {
            console.log('❌ No user/driver found with this ID');
            console.log('\nProblem: Driver registration may have failed');
            console.log('Solution: Try registering again');
        }

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed\n');
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

checkDriver();
