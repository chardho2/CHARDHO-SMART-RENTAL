require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Driver = require('../models/Driver');

async function verifyMigration() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Count users
        const userCount = await User.countDocuments();
        console.log(`👥 Users in users collection: ${userCount}`);

        // Count drivers
        const driverCount = await Driver.countDocuments();
        console.log(`🚗 Drivers in drivers collection: ${driverCount}`);

        // Check for any remaining drivers in users collection
        const remainingDrivers = await User.countDocuments({
            $or: [{ role: 'driver' }, { userType: 'driver' }]
        });
        console.log(`⚠️  Drivers remaining in users collection: ${remainingDrivers}\n`);

        if (remainingDrivers === 0) {
            console.log('✅ Migration successful! No drivers in users collection.\n');
        } else {
            console.log('❌ Migration incomplete! Some drivers still in users collection.\n');
        }

        // Show all drivers
        console.log('📋 Drivers in drivers collection:\n');
        const drivers = await Driver.find().select('name email isOnline vehicle.type rating');
        drivers.forEach((driver, index) => {
            console.log(`${index + 1}. ${driver.name} (${driver.email})`);
            console.log(`   Online: ${driver.isOnline}`);
            console.log(`   Vehicle: ${driver.vehicle?.type || 'Not set'}`);
            console.log(`   Rating: ${driver.rating}`);
            console.log('');
        });

        // Show all users
        console.log('📋 Users in users collection:\n');
        const users = await User.find().select('name email');
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.email})`);
        });

        await mongoose.connection.close();
        console.log('\n✅ Verification complete');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

verifyMigration();
