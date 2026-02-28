// Verify the password reset worked
// Run with: node backend/scripts/verifyPasswordReset.js

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Driver = require('../models/Driver');
const bcrypt = require('bcryptjs');

const DRIVER_EMAIL = 'shaikmuzzu600@gmail.com';
const EXPECTED_PASSWORD = 'NewSecure123!';

async function verify() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const driver = await Driver.findOne({ email: DRIVER_EMAIL.toLowerCase() });

        if (!driver) {
            console.log('❌ Driver not found!');
            process.exit(1);
        }

        console.log('Driver:', driver.name);
        console.log('Email:', driver.email);
        console.log('\nPassword hash in database:');
        console.log(driver.password);
        console.log('\nHash length:', driver.password.length);
        console.log('Starts with $2:', driver.password.startsWith('$2'));

        console.log('\n🔐 Testing password:', EXPECTED_PASSWORD);
        const isMatch = await bcrypt.compare(EXPECTED_PASSWORD, driver.password);

        if (isMatch) {
            console.log('\n✅✅✅ PASSWORD MATCHES! ✅✅✅');
            console.log('The password reset worked correctly.');
            console.log('\nIf login still fails, the issue is elsewhere (not the password).');
        } else {
            console.log('\n❌❌❌ PASSWORD DOES NOT MATCH! ❌❌❌');
            console.log('The password reset did NOT work properly!');
            console.log('\nLet me try resetting it again...');

            const newHash = await bcrypt.hash(EXPECTED_PASSWORD, 12);
            driver.password = newHash;
            await driver.save();

            console.log('✅ Password re-hashed and saved!');
            console.log('\nNew hash:', newHash);

            // Test again
            const isMatch2 = await bcrypt.compare(EXPECTED_PASSWORD, driver.password);
            if (isMatch2) {
                console.log('\n✅ NOW IT MATCHES! Try logging in again.');
            } else {
                console.log('\n❌ Still not matching. There may be a deeper issue.');
            }
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

verify();
