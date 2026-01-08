const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Driver = require('./models/Driver');

const NEW_PASSWORD = 'Password@123'; // Default password for all fixed accounts

async function fixAllOAuthUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // 1. Fix Users
        const users = await User.find({
            $or: [
                { password: { $exists: false } },
                { password: null },
                { password: '' }
            ]
        });

        console.log(`🔍 Found ${users.length} Users without passwords`);

        for (const user of users) {
            user.password = NEW_PASSWORD;
            await user.save();
            console.log(`   ✅ Fixed User: ${user.email}`);
        }

        // 2. Fix Drivers
        const drivers = await Driver.find({
            $or: [
                { password: { $exists: false } },
                { password: null },
                { password: '' }
            ]
        });

        console.log(`\n🔍 Found ${drivers.length} Drivers without passwords`);

        for (const driver of drivers) {
            driver.password = NEW_PASSWORD;
            await driver.save();
            console.log(`   ✅ Fixed Driver: ${driver.email}`);
        }

        console.log('\n🎉 All OAuth accounts have been updated!');
        console.log(`💡 You can now log in to ANY of these accounts with password: ${NEW_PASSWORD}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

fixAllOAuthUsers();
