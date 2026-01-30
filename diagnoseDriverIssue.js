const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/chradhogo');

const Driver = require('./server/models/Driver');

async function diagnose() {
    try {
        console.log('🔍 DRIVER DIAGNOSTIC REPORT\n');
        console.log('='.repeat(60));

        // 1. Count total drivers
        const totalDrivers = await Driver.countDocuments({});
        console.log(`\n📊 Total drivers in database: ${totalDrivers}`);

        // 2. Count online drivers
        const onlineDrivers = await Driver.countDocuments({ isOnline: true });
        console.log(`✅ Online drivers: ${onlineDrivers}`);

        // 3. List all drivers with their status
        const allDrivers = await Driver.find({}).select('name email isOnline location vehicle');

        console.log('\n📋 DRIVER LIST:');
        console.log('='.repeat(60));

        allDrivers.forEach((driver, index) => {
            console.log(`\n${index + 1}. ${driver.name} (${driver.email})`);
            console.log(`   Status: ${driver.isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
            console.log(`   Location: ${driver.location?.latitude ? `${driver.location.latitude}, ${driver.location.longitude}` : '❌ NO LOCATION'}`);
            console.log(`   Vehicle: ${driver.vehicle?.type || 'N/A'} - ${driver.vehicle?.model || 'N/A'}`);
            console.log(`   Plate: ${driver.vehicle?.plateNumber || 'N/A'}`);
        });

        // 4. Check if online drivers have location
        console.log('\n\n🔍 ONLINE DRIVERS WITH LOCATION CHECK:');
        console.log('='.repeat(60));

        const onlineDriversList = await Driver.find({ isOnline: true });

        if (onlineDriversList.length === 0) {
            console.log('❌ NO ONLINE DRIVERS FOUND!');
            console.log('\n💡 SOLUTION: Set a driver online using:');
            console.log('   1. Open MongoDB Compass');
            console.log('   2. Connect to mongodb://127.0.0.1:27017');
            console.log('   3. Database: chradhogo → Collection: drivers');
            console.log('   4. Edit a driver document and set:');
            console.log('      - isOnline: true');
            console.log('      - location.latitude: 14.6819');
            console.log('      - location.longitude: 77.6006');
        } else {
            onlineDriversList.forEach((driver, index) => {
                const hasLocation = driver.location?.latitude && driver.location?.longitude;
                console.log(`\n${index + 1}. ${driver.name}`);
                console.log(`   Location: ${hasLocation ? '✅ HAS LOCATION' : '❌ NO LOCATION'}`);
                if (hasLocation) {
                    console.log(`   Coordinates: ${driver.location.latitude}, ${driver.location.longitude}`);
                } else {
                    console.log('   ⚠️ This driver will NOT appear in search results!');
                }
            });
        }

        // 5. Test query that the API uses
        console.log('\n\n🧪 TESTING API QUERY:');
        console.log('='.repeat(60));

        const testQuery = { isOnline: true };
        const testResults = await Driver.find(testQuery).select('name email location vehicle');

        console.log(`Query: { isOnline: true }`);
        console.log(`Results: ${testResults.length} driver(s)`);

        if (testResults.length > 0) {
            console.log('\n✅ DRIVERS THAT SHOULD APPEAR IN APP:');
            testResults.forEach((driver, index) => {
                const hasLocation = driver.location?.latitude && driver.location?.longitude;
                console.log(`   ${index + 1}. ${driver.name} - ${hasLocation ? '✅ Will show' : '⚠️ Will show with fallback 0.5km'}`);
            });
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ Diagnostic complete!\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

diagnose();
