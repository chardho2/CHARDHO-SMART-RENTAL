// Script to check real-time driver data in the drivers collection
// Run with: node backend/scripts/checkDriverData.js

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Driver = require('../models/Driver');

async function checkDriverData() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find all drivers
        const allDrivers = await Driver.find({});
        console.log(`📊 Total drivers in database: ${allDrivers.length}\n`);

        if (allDrivers.length === 0) {
            console.log('⚠️  No drivers found in database!');
            console.log('   Please run: node backend/scripts/setupAllDrivers.js\n');
            await mongoose.connection.close();
            return;
        }

        // Display each driver's details
        console.log('═'.repeat(80));
        console.log('DRIVER DATA REPORT');
        console.log('═'.repeat(80));

        allDrivers.forEach((driver, index) => {
            console.log(`\n${index + 1}. ${driver.name}`);
            console.log('─'.repeat(80));
            console.log(`   📧 Email: ${driver.email}`);
            console.log(`   📱 Phone: ${driver.phone}`);
            console.log(`   🟢 Online: ${driver.isOnline ? '✅ YES' : '❌ NO'}`);
            console.log(`   ✓ Active: ${driver.isActive ? '✅ YES' : '❌ NO'}`);
            console.log(`   ⭐ Rating: ${driver.rating.toFixed(1)} (${driver.totalRides} rides)`);

            // Vehicle info
            console.log(`   🚗 Vehicle:`);
            console.log(`      Type: ${driver.vehicle?.type || '❌ NOT SET'}`);
            console.log(`      Model: ${driver.vehicle?.model || '❌ NOT SET'}`);
            console.log(`      Plate: ${driver.vehicle?.plateNumber || '❌ NOT SET'}`);
            console.log(`      Color: ${driver.vehicle?.color || 'N/A'}`);
            console.log(`      Year: ${driver.vehicle?.year || 'N/A'}`);

            // Location info
            console.log(`   📍 Location:`);
            if (driver.location?.latitude && driver.location?.longitude) {
                console.log(`      GPS: ✅ (${driver.location.latitude}, ${driver.location.longitude})`);
                if (driver.location.lastUpdated) {
                    console.log(`      Updated: ${new Date(driver.location.lastUpdated).toLocaleString()}`);
                }
            } else {
                console.log(`      GPS: ❌ NOT SET`);
            }

            // Check for issues
            const issues = [];
            if (!driver.isOnline) issues.push('Driver is OFFLINE');
            if (!driver.isActive) issues.push('Driver is INACTIVE');
            if (!driver.vehicle?.type) issues.push('Vehicle type NOT SET');
            if (!driver.vehicle?.model) issues.push('Vehicle model NOT SET');
            if (!driver.vehicle?.plateNumber) issues.push('Vehicle plate number NOT SET');
            if (!driver.location?.latitude || !driver.location?.longitude) {
                issues.push('GPS location NOT SET');
            }

            if (issues.length > 0) {
                console.log(`   ⚠️  Issues:`);
                issues.forEach(issue => console.log(`      ❌ ${issue}`));
            } else {
                console.log(`   ✅ All data complete!`);
            }
        });

        // Summary statistics
        console.log('\n' + '═'.repeat(80));
        console.log('SUMMARY STATISTICS');
        console.log('═'.repeat(80));

        const onlineDrivers = allDrivers.filter(d => d.isOnline);
        const activeDrivers = allDrivers.filter(d => d.isActive);
        const driversWithVehicle = allDrivers.filter(d =>
            d.vehicle?.type && d.vehicle?.model && d.vehicle?.plateNumber
        );
        const driversWithLocation = allDrivers.filter(d =>
            d.location?.latitude && d.location?.longitude
        );

        console.log(`\n📊 Driver Status:`);
        console.log(`   Total Drivers: ${allDrivers.length}`);
        console.log(`   Online: ${onlineDrivers.length} (${((onlineDrivers.length / allDrivers.length) * 100).toFixed(0)}%)`);
        console.log(`   Active: ${activeDrivers.length} (${((activeDrivers.length / allDrivers.length) * 100).toFixed(0)}%)`);

        console.log(`\n🚗 Vehicle Data:`);
        console.log(`   Complete Vehicle Info: ${driversWithVehicle.length} (${((driversWithVehicle.length / allDrivers.length) * 100).toFixed(0)}%)`);
        console.log(`   Missing Vehicle Info: ${allDrivers.length - driversWithVehicle.length}`);

        console.log(`\n📍 Location Data:`);
        console.log(`   With GPS Location: ${driversWithLocation.length} (${((driversWithLocation.length / allDrivers.length) * 100).toFixed(0)}%)`);
        console.log(`   Without GPS Location: ${allDrivers.length - driversWithLocation.length}`);

        // Test the actual query used by the API
        console.log('\n' + '═'.repeat(80));
        console.log('API QUERY TEST (What users will see)');
        console.log('═'.repeat(80));

        const apiQuery = {
            isOnline: true,
            isActive: true,
            'vehicle.type': { $exists: true, $ne: null },
            'vehicle.model': { $exists: true, $ne: null },
            'vehicle.plateNumber': { $exists: true, $ne: null }
        };

        console.log('\n📋 Query:', JSON.stringify(apiQuery, null, 2));

        const availableDrivers = await Driver.find(apiQuery)
            .select('name vehicle rating totalRides location isOnline');

        console.log(`\n✅ Drivers that would appear in booking: ${availableDrivers.length}`);

        if (availableDrivers.length === 0) {
            console.log('\n❌ NO DRIVERS WOULD SHOW IN BOOKING!');
            console.log('\n🔧 Possible Solutions:');

            if (onlineDrivers.length === 0) {
                console.log('   1. Set drivers to online:');
                console.log('      node backend/scripts/setDriversOnline.js');
            }

            if (driversWithVehicle.length < allDrivers.length) {
                console.log('   2. Add vehicle information to drivers:');
                console.log('      node backend/scripts/setupAllDrivers.js');
            }

            if (driversWithLocation.length < allDrivers.length) {
                console.log('   3. Add GPS locations to drivers:');
                console.log('      node backend/scripts/setDriverLocations.js');
            }
        } else {
            console.log('\n✅ These drivers would show in booking:\n');
            availableDrivers.forEach((d, i) => {
                const hasGPS = d.location?.latitude && d.location?.longitude;
                console.log(`   ${i + 1}. ${d.name}`);
                console.log(`      Vehicle: ${d.vehicle.type.toUpperCase()} ${d.vehicle.model} (${d.vehicle.plateNumber})`);
                console.log(`      Rating: ${d.rating.toFixed(1)} ⭐ (${d.totalRides} rides)`);
                console.log(`      GPS: ${hasGPS ? '✅ Available' : '⚠️  Not set (will use estimated distance)'}`);
                console.log('');
            });
        }

        // Vehicle type breakdown
        console.log('\n📊 Vehicle Type Breakdown:');
        const vehicleTypes = ['bike', 'auto', 'car', 'suv'];
        vehicleTypes.forEach(type => {
            const count = availableDrivers.filter(d => d.vehicle?.type === type).length;
            if (count > 0) {
                console.log(`   ${type.toUpperCase()}: ${count} driver(s)`);
            }
        });

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed\n');
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

checkDriverData();
