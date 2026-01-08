// Fixed password reset script that bypasses the pre-save hook
// Run with: node backend/scripts/resetDriverPasswordFixed.js

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Driver = require('../models/Driver');
const bcrypt = require('bcryptjs');

const DRIVER_EMAIL = 'shaikmuzzu600@gmail.com';
const NEW_PASSWORD = 'NewSecure123!'; // Change this to your desired password

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

        const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);

        // Use updateOne to bypass the pre-save hook
        await Driver.updateOne(
            { _id: driver._id },
            { $set: { password: hashedPassword } }
        );

        console.log('✅ Password updated successfully (bypassing pre-save hook)!\n');

        // Verify it worked
        const updatedDriver = await Driver.findById(driver._id);
        const isMatch = await bcrypt.compare(NEW_PASSWORD, updatedDriver.password);

        if (isMatch) {
            console.log('✅✅✅ VERIFICATION SUCCESSFUL! ✅✅✅\n');
            console.log('═'.repeat(80));
            console.log('NEW LOGIN CREDENTIALS');
            console.log('═'.repeat(80));
            console.log('Email:', DRIVER_EMAIL);
            console.log('Password:', NEW_PASSWORD);
            console.log('═'.repeat(80));
            console.log('\n✅ You can now login with these credentials!\n');
        } else {
            console.log('❌ Verification failed! Password still not matching.');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

resetPassword();
