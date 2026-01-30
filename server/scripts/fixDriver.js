// Quick fix script to setup driver properly
// Run with: node backend/scripts/fixDriver.js YOUR_DRIVER_EMAIL

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

async function fixDriver() {
    try {
        const driverEmail = process.argv[2];

        if (!driverEmail) {
            console.log('❌ Please provide driver email');
            console.log('Usage: node scripts/fixDriver.js driver@email.com');
            process.exit(1);
        }

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find driver
        const driver = await User.findOne({ email: driverEmail });

        if (!driver) {
            console.log(`❌ Driver not found with email: ${driverEmail}`);
            console.log('\nAvailable users:');
            const users = await User.find({}).select('name email role userType');
            users.forEach(u => {
                console.log(`  - ${u.email} (${u.name})`);
            });
            process.exit(1);
        }

        console.log(`📋 Current driver status:`);
        console.log(`  Name: ${driver.name}`);
        console.log(`  Email: ${driver.email}`);
        console.log(`  Role: ${driver.role}`);
        console.log(`  UserType: ${driver.userType}`);
        console.log(`  Is Online: ${driver.isOnline}`);
        console.log(`  Vehicle Type: ${driver.vehicle?.type || 'NOT SET'}`);
        console.log(`  Vehicle Model: ${driver.vehicle?.model || 'NOT SET'}`);
        console.log(`  Vehicle Plate: ${driver.vehicle?.plateNumber || 'NOT SET'}`);
        console.log('');

        // Fix driver
        console.log('🔧 Applying fixes...\n');

        // Ensure role and userType are set
        if (driver.role !== 'driver') {
            console.log('  ✅ Setting role to "driver"');
            driver.role = 'driver';
        }
        if (driver.userType !== 'driver') {
            console.log('  ✅ Setting userType to "driver"');
            driver.userType = 'driver';
        }

        // Set online
        if (!driver.isOnline) {
            console.log('  ✅ Setting driver ONLINE');
            driver.isOnline = true;
        }

        // Ensure vehicle object exists
        if (!driver.vehicle) {
            driver.vehicle = {};
        }

        // Set vehicle type if not set
        if (!driver.vehicle.type) {
            console.log('  ✅ Setting vehicle type to "bike"');
            driver.vehicle.type = 'bike';
        }

        // Set vehicle model if not set
        if (!driver.vehicle.model) {
            console.log('  ✅ Setting vehicle model to "Honda Activa"');
            driver.vehicle.model = 'Honda Activa';
        }

        // Set vehicle plate if not set
        if (!driver.vehicle.plateNumber) {
            console.log('  ✅ Setting vehicle plate to "DL-01-AB-1234"');
            driver.vehicle.plateNumber = 'DL-01-AB-1234';
        }

        // Set default rating if not set
        if (!driver.rating || driver.rating === 0) {
            console.log('  ✅ Setting default rating to 4.5');
            driver.rating = 4.5;
        }

        // Save changes
        await driver.save();

        console.log('\n✅ Driver fixed successfully!\n');

        // Show final status
        console.log('📋 Updated driver status:');
        console.log(`  Name: ${driver.name}`);
        console.log(`  Email: ${driver.email}`);
        console.log(`  Role: ${driver.role}`);
        console.log(`  UserType: ${driver.userType}`);
        console.log(`  Is Online: ${driver.isOnline} ✅`);
        console.log(`  Vehicle Type: ${driver.vehicle.type} ✅`);
        console.log(`  Vehicle Model: ${driver.vehicle.model} ✅`);
        console.log(`  Vehicle Plate: ${driver.vehicle.plateNumber} ✅`);
        console.log(`  Rating: ${driver.rating} ✅`);
        console.log('');

        // Test query
        console.log('🧪 Testing booking query...');
        const testQuery = {
            $or: [
                { role: 'driver' },
                { userType: 'driver' }
            ],
            isOnline: true,
            'vehicle.type': 'bike'
        };

        const found = await User.findOne(testQuery);

        if (found && found.email === driverEmail) {
            console.log('✅ SUCCESS! Driver will now show in booking!');
        } else {
            console.log('⚠️  Driver still not found by query. Checking why...');

            // Debug
            const roleCheck = await User.findOne({
                email: driverEmail,
                $or: [{ role: 'driver' }, { userType: 'driver' }]
            });
            console.log('  Role check:', roleCheck ? '✅ PASS' : '❌ FAIL');

            const onlineCheck = await User.findOne({
                email: driverEmail,
                isOnline: true
            });
            console.log('  Online check:', onlineCheck ? '✅ PASS' : '❌ FAIL');

            const vehicleCheck = await User.findOne({
                email: driverEmail,
                'vehicle.type': 'bike'
            });
            console.log('  Vehicle check:', vehicleCheck ? '✅ PASS' : '❌ FAIL');
        }

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixDriver();
