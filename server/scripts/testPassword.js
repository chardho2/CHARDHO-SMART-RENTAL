// Quick test to verify a password against the stored hash
// Run with: node backend/scripts/testPassword.js

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Driver = require('../models/Driver');
const bcrypt = require('bcryptjs');

const DRIVER_EMAIL = 'shaikmuzzu600@gmail.com';
const TEST_PASSWORD = 'TestPassword123!'; // ← PUT THE PASSWORD YOU'RE TRYING TO LOGIN WITH HERE

async function testPassword() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const driver = await Driver.findOne({ email: DRIVER_EMAIL.toLowerCase() });

        if (!driver) {
            console.log('❌ Driver not found!');
            process.exit(1);
        }

        console.log('Testing password for:', driver.name);
        console.log('Email:', driver.email);
        console.log('\nPassword you entered in script:', TEST_PASSWORD);
        console.log('Testing against stored hash...\n');

        const isMatch = await bcrypt.compare(TEST_PASSWORD, driver.password);

        if (isMatch) {
            console.log('✅✅✅ PASSWORD MATCHES! ✅✅✅');
            console.log('\nThis password is CORRECT!');
            console.log('If login still fails, there may be a different issue.');
        } else {
            console.log('❌❌❌ PASSWORD DOES NOT MATCH! ❌❌❌');
            console.log('\nThis is NOT the correct password.');
            console.log('\nOptions:');
            console.log('1. Try a different password in this script');
            console.log('2. Reset password using resetDriverPassword.js');
            console.log('3. Re-register with a new account');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

testPassword();
