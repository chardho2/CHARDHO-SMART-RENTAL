// Script to reset driver password
// Run with: node backend/scripts/resetDriverPassword.js

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Driver = require('../models/Driver');
const bcrypt = require('bcryptjs');

const DRIVER_EMAIL = 'shaikmuzzu600@gmail.com';
const NEW_PASSWORD = 'NewSecure123!'; // Change this to your new password

async function resetPassword() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        console.log('🔍 Finding driver:', DRIVER_EMAIL);
        const driver = await Driver.findOne({ email: DRIVER_EMAIL.toLowerCase() });

        if (!driver) {
            console.log('❌ Driver not found!');
            process.exit(1);
        }

        console.log('✅ Driver found:', driver.name);
        console.log('\n🔐 Hashing new password...');

        const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 12);
        driver.password = hashedPassword;

        await driver.save();

        console.log('✅ Password updated successfully!\n');
        console.log('═'.repeat(80));
        console.log('NEW LOGIN CREDENTIALS');
        console.log('═'.repeat(80));
        console.log('Email:', DRIVER_EMAIL);
        console.log('Password:', NEW_PASSWORD);
        console.log('═'.repeat(80));
        console.log('\n✅ You can now login with these credentials!\n');

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

resetPassword();
