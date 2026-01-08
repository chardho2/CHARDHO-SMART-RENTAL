require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

async function setDriverLocations() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all drivers
        const drivers = await User.find({
            $or: [
                { role: 'driver' },
                { userType: 'driver' }
            ]
        }).select('name email location');

        console.log(`📍 Setting locations for ${drivers.length} drivers...\n`);

        // Base location (you can change this to your area)
        // Example: Anantapur, Andhra Pradesh
        const baseLatitude = 14.6819;
        const baseLongitude = 77.6006;

        for (let i = 0; i < drivers.length; i++) {
            const driver = drivers[i];

            // Add small random offset to create nearby drivers
            // Offset range: ~0.01 degrees ≈ ~1 km
            const latOffset = (Math.random() - 0.5) * 0.02; // ±1 km
            const lonOffset = (Math.random() - 0.5) * 0.02; // ±1 km

            driver.location = {
                latitude: baseLatitude + latOffset,
                longitude: baseLongitude + lonOffset,
                lastUpdated: new Date()
            };

            await driver.save();

            console.log(`✅ ${driver.name || driver.email}`);
            console.log(`   Lat: ${driver.location.latitude.toFixed(6)}`);
            console.log(`   Lng: ${driver.location.longitude.toFixed(6)}`);
            console.log('');
        }

        console.log(`\n✅ Set locations for ${drivers.length} drivers!\n`);

        // Test distance calculation
        console.log('🧪 Testing distance calculations...\n');

        const testLat = baseLatitude;
        const testLng = baseLongitude;

        console.log(`User location: ${testLat.toFixed(6)}, ${testLng.toFixed(6)}\n`);

        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371;
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        const driversWithDistance = drivers.map(driver => {
            const distance = calculateDistance(
                testLat,
                testLng,
                driver.location.latitude,
                driver.location.longitude
            );

            return {
                name: driver.name || driver.email,
                distance: distance.toFixed(2)
            };
        });

        driversWithDistance.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

        console.log('Drivers sorted by distance:');
        driversWithDistance.forEach((d, i) => {
            console.log(`  ${i + 1}. ${d.name} - ${d.distance} km away`);
        });

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

setDriverLocations();
