require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Booking = require('../models/Booking');

async function migrateToSeparateCollections() {
    try {
        console.log('🔄 Starting migration to separate collections...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Step 1: Find all drivers in users collection
        const driversInUsers = await User.find({
            $or: [
                { role: 'driver' },
                { userType: 'driver' }
            ]
        });

        console.log(`📊 Found ${driversInUsers.length} drivers in users collection\n`);

        if (driversInUsers.length === 0) {
            console.log('⚠️  No drivers found to migrate');
            await mongoose.connection.close();
            return;
        }

        // Step 2: Create mapping of old IDs to new IDs
        const idMapping = new Map();

        // Step 3: Migrate each driver
        console.log('🚚 Migrating drivers...\n');

        for (const oldDriver of driversInUsers) {
            try {
                // Check if driver already exists in drivers collection
                const existingDriver = await Driver.findOne({ email: oldDriver.email });

                if (existingDriver) {
                    console.log(`⚠️  Driver ${oldDriver.email} already exists in drivers collection, skipping...`);
                    idMapping.set(oldDriver._id.toString(), existingDriver._id.toString());
                    continue;
                }

                // Create driver data object (POJO) to avoid Mongoose wrapping immediately
                const driverData = {
                    name: oldDriver.name,
                    email: oldDriver.email,
                    phone: oldDriver.phone,
                    password: oldDriver.password, // Already hashed, insertMany won't trigger pre('save') hashing
                    profilePicture: oldDriver.avatar || null,
                    isOnline: oldDriver.isOnline || false,
                    vehicle: oldDriver.vehicle || {},
                    location: oldDriver.location || {},
                    rating: oldDriver.rating || 0,
                    totalRides: oldDriver.totalRides || 0,
                    totalEarnings: 0,
                    totalRatings: 0,
                    ratingSum: oldDriver.rating ? oldDriver.rating * (oldDriver.totalRides || 1) : 0,
                    isVerified: false,
                    isActive: true,
                    createdAt: oldDriver.createdAt,
                    updatedAt: oldDriver.updatedAt
                };

                // Use insertMany to bypass pre('save') middleware which would double-hash the password
                const result = await Driver.insertMany([driverData]);
                const newDriver = result[0];

                // Store ID mapping
                idMapping.set(oldDriver._id.toString(), newDriver._id.toString());

                console.log(`✅ Migrated: ${oldDriver.name} (${oldDriver.email})`);
                console.log(`   Old ID: ${oldDriver._id}`);
                console.log(`   New ID: ${newDriver._id}`);
                console.log(`   Vehicle: ${newDriver.vehicle?.type || 'Not set'}`);
                console.log(`   Rating: ${newDriver.rating}`);
                console.log('');
            } catch (error) {
                console.error(`❌ Error migrating ${oldDriver.email}:`, error.message);
            }
        }

        // Step 4: Update bookings to reference new driver IDs
        console.log('\n📝 Updating bookings...\n');

        let updatedBookings = 0;
        for (const [oldId, newId] of idMapping.entries()) {
            const result = await Booking.updateMany(
                { driver: oldId },
                { $set: { driver: newId } }
            );

            if (result.modifiedCount > 0) {
                console.log(`✅ Updated ${result.modifiedCount} bookings for driver ${oldId} -> ${newId}`);
                updatedBookings += result.modifiedCount;
            }
        }

        console.log(`\n✅ Total bookings updated: ${updatedBookings}\n`);

        // Step 5: Remove drivers from users collection
        console.log('🗑️  Removing drivers from users collection...\n');

        const driverIds = Array.from(idMapping.keys());
        const deleteResult = await User.deleteMany({
            _id: { $in: driverIds }
        });

        console.log(`✅ Removed ${deleteResult.deletedCount} drivers from users collection\n`);

        // Step 6: Verify migration
        console.log('🔍 Verifying migration...\n');

        const remainingDriversInUsers = await User.countDocuments({
            $or: [{ role: 'driver' }, { userType: 'driver' }]
        });

        const driversInDriversCollection = await Driver.countDocuments();
        const usersInUsersCollection = await User.countDocuments();

        console.log('📊 Final counts:');
        console.log(`   Users in users collection: ${usersInUsersCollection}`);
        console.log(`   Drivers in drivers collection: ${driversInDriversCollection}`);
        console.log(`   Drivers remaining in users collection: ${remainingDriversInUsers}`);
        console.log('');

        if (remainingDriversInUsers === 0) {
            console.log('✅ Migration completed successfully!');
        } else {
            console.log('⚠️  Warning: Some drivers still remain in users collection');
        }

        // Step 7: Show summary
        console.log('\n📋 Migration Summary:');
        console.log(`   Drivers migrated: ${idMapping.size}`);
        console.log(`   Bookings updated: ${updatedBookings}`);
        console.log(`   Drivers removed from users: ${deleteResult.deletedCount}`);
        console.log('');

        await mongoose.connection.close();
        console.log('✅ Database connection closed');

    } catch (error) {
        console.error('❌ Migration error:', error);
        process.exit(1);
    }
}

// Run migration
migrateToSeparateCollections();
