require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

async function quickCheck() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected\n');

        // Check Vara's account
        const vara = await User.findOne({ email: 'maddanavaraprasadmec092@gmail.com' });

        if (vara) {
            console.log('📋 Vara Account Status:');
            console.log('  Name:', vara.name);
            console.log('  Email:', vara.email);
            console.log('  Role:', vara.role);
            console.log('  UserType:', vara.userType);
            console.log('  Is Online:', vara.isOnline);
            console.log('  Vehicle Type:', vara.vehicle?.type || 'NOT SET');
            console.log('  Vehicle Model:', vara.vehicle?.model || 'NOT SET');
            console.log('');

            // Fix if needed
            let fixed = false;

            if (vara.role !== 'driver') {
                vara.role = 'driver';
                fixed = true;
                console.log('✅ Fixed: Set role to driver');
            }

            if (vara.userType !== 'driver') {
                vara.userType = 'driver';
                fixed = true;
                console.log('✅ Fixed: Set userType to driver');
            }

            if (!vara.isOnline) {
                vara.isOnline = true;
                fixed = true;
                console.log('✅ Fixed: Set online to true');
            }

            if (!vara.vehicle) vara.vehicle = {};

            if (!vara.vehicle.type) {
                vara.vehicle.type = 'bike';
                fixed = true;
                console.log('✅ Fixed: Set vehicle type to bike');
            }

            if (!vara.vehicle.model) {
                vara.vehicle.model = 'Honda Activa';
                fixed = true;
                console.log('✅ Fixed: Set vehicle model');
            }

            if (!vara.vehicle.plateNumber) {
                vara.vehicle.plateNumber = 'AP-01-AB-1234';
                fixed = true;
                console.log('✅ Fixed: Set vehicle plate');
            }

            if (fixed) {
                await vara.save();
                console.log('\n✅ Changes saved!\n');
            } else {
                console.log('\n✅ Already configured correctly!\n');
            }

            // Test query
            console.log('🧪 Testing booking query...');
            const found = await User.findOne({
                $or: [{ role: 'driver' }, { userType: 'driver' }],
                isOnline: true,
                'vehicle.type': 'bike'
            });

            if (found && found.email === vara.email) {
                console.log('✅ SUCCESS! Vara will now show in booking!\n');
            } else {
                console.log('❌ Still not found. Current values:');
                console.log('  role:', vara.role);
                console.log('  userType:', vara.userType);
                console.log('  isOnline:', vara.isOnline);
                console.log('  vehicle.type:', vara.vehicle?.type);
            }
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

quickCheck();
