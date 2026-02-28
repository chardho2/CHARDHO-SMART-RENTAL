require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

async function setupAllDrivers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all users
        const allUsers = await User.find({}).select('name email role userType isOnline vehicle');

        console.log(`📊 Found ${allUsers.length} total users\n`);

        // Potential drivers (you can modify this list)
        const driverEmails = [
            'testdriver@example.com',
            'maddanavaraprasadmec092@gmail.com', // Vara
            // Add more emails here if you want more drivers
        ];

        console.log('🔧 Setting up drivers...\n');

        let setupCount = 0;
        const vehicleTypes = ['bike', 'auto', 'car', 'suv'];
        const vehicleModels = {
            bike: ['Honda Activa', 'TVS Jupiter', 'Suzuki Access'],
            auto: ['Bajaj Auto', 'Piaggio Ape', 'Mahindra Auto'],
            car: ['Maruti Swift', 'Hyundai i20', 'Honda City'],
            suv: ['Mahindra Scorpio', 'Toyota Innova', 'Maruti Ertiga']
        };

        for (let i = 0; i < driverEmails.length; i++) {
            const email = driverEmails[i];
            const driver = await User.findOne({ email });

            if (driver) {
                // Assign different vehicle types to different drivers
                const vehicleType = vehicleTypes[i % vehicleTypes.length];
                const models = vehicleModels[vehicleType];
                const vehicleModel = models[i % models.length];

                driver.role = 'driver';
                driver.userType = 'driver';
                driver.isOnline = true;

                if (!driver.vehicle) driver.vehicle = {};
                driver.vehicle.type = vehicleType;
                driver.vehicle.model = vehicleModel;
                driver.vehicle.plateNumber = `AP-${String(i + 1).padStart(2, '0')}-AB-${String(1234 + i).padStart(4, '0')}`;
                driver.vehicle.color = ['Black', 'White', 'Silver', 'Red'][i % 4];
                driver.vehicle.year = 2020 + (i % 4);

                if (!driver.rating || driver.rating === 0) {
                    driver.rating = 4.0 + (Math.random() * 1); // 4.0 to 5.0
                }

                if (!driver.totalRides) {
                    driver.totalRides = Math.floor(Math.random() * 100);
                }

                await driver.save();

                console.log(`✅ ${driver.name || email}`);
                console.log(`   Email: ${email}`);
                console.log(`   Vehicle: ${vehicleType} - ${vehicleModel}`);
                console.log(`   Plate: ${driver.vehicle.plateNumber}`);
                console.log(`   Rating: ${driver.rating.toFixed(1)}`);
                console.log(`   Total Rides: ${driver.totalRides}`);
                console.log('');

                setupCount++;
            } else {
                console.log(`⚠️  User not found: ${email}`);
            }
        }

        console.log(`\n✅ Setup ${setupCount} drivers successfully!\n`);

        // Test queries for each vehicle type
        console.log('🧪 Testing queries for each vehicle type...\n');

        for (const vehicleType of vehicleTypes) {
            const found = await User.find({
                $or: [{ role: 'driver' }, { userType: 'driver' }],
                isOnline: true,
                'vehicle.type': vehicleType
            }).select('name vehicle.type vehicle.model');

            console.log(`${vehicleType.toUpperCase()}: ${found.length} driver(s)`);
            found.forEach(d => {
                console.log(`  - ${d.name} (${d.vehicle.model})`);
            });
        }

        // Show all online drivers
        console.log('\n📋 All Online Drivers:\n');
        const allOnline = await User.find({
            $or: [{ role: 'driver' }, { userType: 'driver' }],
            isOnline: true
        }).select('name email vehicle.type vehicle.model rating');

        allOnline.forEach((d, i) => {
            console.log(`${i + 1}. ${d.name || 'No Name'}`);
            console.log(`   Email: ${d.email}`);
            console.log(`   Vehicle: ${d.vehicle?.type} - ${d.vehicle?.model}`);
            console.log(`   Rating: ${d.rating?.toFixed(1) || 'N/A'}`);
            console.log('');
        });

        console.log(`\n✅ Total Online Drivers: ${allOnline.length}\n`);

        await mongoose.connection.close();
        console.log('✅ Database connection closed');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

setupAllDrivers();
