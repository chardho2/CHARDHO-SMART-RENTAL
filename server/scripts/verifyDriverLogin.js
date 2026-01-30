// Script to verify driver login credentials
// Run with: node backend/scripts/verifyDriverLogin.js

require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Driver = require('../models/Driver');
const bcrypt = require('bcryptjs');

const TEST_EMAIL = 'shaikmuzzu600@gmail.com';
const TEST_PASSWORD = 'YourPasswordHere'; // Replace with the password you used

async function verifyDriver() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        console.log('🔍 Searching for driver with email:', TEST_EMAIL);
        console.log('═'.repeat(80));

        // Find driver
        const driver = await Driver.findOne({ email: TEST_EMAIL.toLowerCase() });

        if (!driver) {
            console.log('\n❌ DRIVER NOT FOUND!');
            console.log('\nPossible reasons:');
            console.log('1. Driver was not created successfully');
            console.log('2. Email is different (check spelling)');
            console.log('3. Driver is in User collection instead of Driver collection');
            console.log('\nSolution: Register again as a driver');

            // Check User collection too
            const User = require('../models/User');
            const user = await User.findOne({ email: TEST_EMAIL.toLowerCase() });
            if (user) {
                console.log('\n⚠️ Found in User collection instead!');
                console.log('Name:', user.name);
                console.log('UserType:', user.userType);
                console.log('\nThis user needs to be migrated to Driver collection');
            }
        } else {
            console.log('\n✅ DRIVER FOUND!');
            console.log('─'.repeat(80));
            console.log('Name:', driver.name);
            console.log('Email:', driver.email);
            console.log('Phone:', driver.phone);
            console.log('Created:', driver.createdAt);
            console.log('Has Password:', !!driver.password);

            if (driver.password) {
                console.log('\n🔑 Password Information:');
                console.log('Password Hash:', driver.password.substring(0, 20) + '...');
                console.log('Hash Length:', driver.password.length);
                console.log('Starts with $2a$ or $2b$:', driver.password.startsWith('$2'));

                if (TEST_PASSWORD !== 'YourPasswordHere') {
                    console.log('\n🔐 Testing Password...');
                    const isMatch = await bcrypt.compare(TEST_PASSWORD, driver.password);

                    if (isMatch) {
                        console.log('✅ PASSWORD MATCHES!');
                        console.log('\nYour login credentials are correct:');
                        console.log('Email:', TEST_EMAIL);
                        console.log('Password: (the one you provided in this script)');
                        console.log('\nIf login still fails, check:');
                        console.log('1. Backend server is running');
                        console.log('2. Frontend is pointing to correct API URL');
                        console.log('3. No network errors');
                    } else {
                        console.log('❌ PASSWORD DOES NOT MATCH!');
                        console.log('\nThe password you provided in this script is incorrect.');
                        console.log('Try a different password or register again.');
                    }
                } else {
                    console.log('\n⚠️ Please edit this script and replace TEST_PASSWORD with your actual password');
                }
            } else {
                console.log('\n❌ NO PASSWORD SET!');
                console.log('This driver has no password. Registration may have failed.');
                console.log('Solution: Register again');
            }

            console.log('\n📊 Driver Status:');
            console.log('Online:', driver.isOnline ? '✅ YES' : '❌ NO');
            console.log('Active:', driver.isActive ? '✅ YES' : '❌ NO');
            console.log('Verified:', driver.isVerified ? '✅ YES' : '❌ NO');

            if (driver.vehicle?.type) {
                console.log('\n🚗 Vehicle:');
                console.log('Type:', driver.vehicle.type);
                console.log('Model:', driver.vehicle.model || 'Not set');
                console.log('Plate:', driver.vehicle.plateNumber || 'Not set');
            } else {
                console.log('\n⚠️ No vehicle information');
            }
        }

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed\n');
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

verifyDriver();
