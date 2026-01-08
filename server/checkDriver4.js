const mongoose = require('mongoose');

async function checkDriver() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/chradhogo');
        console.log('✅ Connected to MongoDB\n');

        const Driver = require('./models/Driver');

        // Find Driver 4
        const driver = await Driver.findOne({ name: 'Driver 4' });

        if (!driver) {
            console.log('❌ Driver 4 not found!');
            console.log('\nSearching for any driver with "4" in the name...');
            const drivers = await Driver.find({ name: /4/i });
            console.log(`Found ${drivers.length} drivers:`, drivers.map(d => d.name));
            await mongoose.disconnect();
            process.exit(1);
        }

        console.log('=== DRIVER 4 STATUS ===\n');
        console.log('📛 Name:', driver.name);
        console.log('📧 Email:', driver.email);
        console.log('🆔 ID:', driver._id);
        console.log('');

        console.log('🟢 Online Status:', driver.isOnline ? '✅ ONLINE' : '❌ OFFLINE');
        console.log('✅ Active Status:', driver.isActive ? '✅ ACTIVE' : '❌ INACTIVE');
        console.log('');

        // Check location
        if (driver.location && driver.location.latitude && driver.location.longitude) {
            console.log('📍 Location: ✅ SET');
            console.log('   Latitude:', driver.location.latitude);
            console.log('   Longitude:', driver.location.longitude);
            console.log('   Last Updated:', driver.location.lastUpdated || 'Never');
        } else {
            console.log('📍 Location: ❌ NOT SET');
            console.log('   This is why the driver is not showing!');
        }
        console.log('');

        // Check vehicle
        if (driver.vehicle && driver.vehicle.type) {
            console.log('🚗 Vehicle: ✅ SET');
            console.log('   Type:', driver.vehicle.type);
            console.log('   Model:', driver.vehicle.model || 'N/A');
            console.log('   Plate:', driver.vehicle.plateNumber || 'N/A');
        } else {
            console.log('🚗 Vehicle: ❌ NOT SET');
        }
        console.log('');

        // Check if driver should show
        const shouldShow = driver.isOnline &&
            driver.location?.latitude &&
            driver.location?.longitude;

        console.log('=== VERDICT ===');
        if (shouldShow) {
            console.log('✅ Driver 4 SHOULD appear in the app!');
            console.log('   If not showing, the issue is in the frontend or API call.');
        } else {
            console.log('❌ Driver 4 will NOT appear because:');
            if (!driver.isOnline) console.log('   - Driver is OFFLINE');
            if (!driver.location?.latitude || !driver.location?.longitude) {
                console.log('   - Driver has NO LOCATION');
            }

            console.log('\n🔧 FIXING NOW...');
            driver.isOnline = true;
            driver.isActive = true;
            driver.location = {
                latitude: 14.6819,
                longitude: 77.6006,
                lastUpdated: new Date()
            };
            if (!driver.vehicle || !driver.vehicle.type) {
                driver.vehicle = {
                    type: 'bike',
                    model: 'Honda',
                    plateNumber: 'AP01XX1234',
                    color: 'Black'
                };
            }
            await driver.save();
            console.log('✅ Driver 4 has been updated!');
            console.log('   Online: true');
            console.log('   Location: 14.6819, 77.6006');
            console.log('   Vehicle: bike');
        }

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

checkDriver();
