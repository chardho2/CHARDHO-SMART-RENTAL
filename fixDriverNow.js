// Quick fix script to set driver online with location
const { MongoClient } = require('mongodb');

const uri = 'mongodb://127.0.0.1:27017';
const dbName = 'chradhogo';

async function fixDriver() {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('✅ Connected to MongoDB\n');

        const db = client.db(dbName);
        const driversCollection = db.collection('drivers');

        // Check all drivers
        const allDrivers = await driversCollection.find({}).toArray();
        console.log(`📊 Total drivers: ${allDrivers.length}\n`);

        if (allDrivers.length === 0) {
            console.log('❌ No drivers found! Please register a driver account first.\n');
            return;
        }

        // Show all drivers
        console.log('=== ALL DRIVERS ===\n');
        allDrivers.forEach((d, i) => {
            console.log(`${i + 1}. ${d.name} (${d.email})`);
            console.log(`   Online: ${d.isOnline ? '🟢 YES' : '🔴 NO'}`);
            console.log(`   Location: ${d.location?.latitude ? `✅ (${d.location.latitude}, ${d.location.longitude})` : '❌ NOT SET'}`);
            console.log(`   Vehicle: ${d.vehicle?.type || 'Not set'}`);
            console.log('');
        });

        // Find online drivers
        const onlineDrivers = allDrivers.filter(d => d.isOnline);
        console.log(`🟢 Online drivers: ${onlineDrivers.length}\n`);

        if (onlineDrivers.length === 0) {
            console.log('⚠️  No drivers are online. Setting first driver online...\n');

            // Set first driver online with location
            const firstDriver = allDrivers[0];
            const result = await driversCollection.updateOne(
                { _id: firstDriver._id },
                {
                    $set: {
                        isOnline: true,
                        isActive: true,
                        location: {
                            latitude: 14.6819,
                            longitude: 77.6006,
                            lastUpdated: new Date()
                        }
                    }
                }
            );

            console.log(`✅ Set ${firstDriver.name} online with location!`);
            console.log(`   Location: Anantapur (14.6819, 77.6006)\n`);
        } else {
            // Check if online drivers have location
            const needsLocation = onlineDrivers.filter(d => !d.location?.latitude || !d.location?.longitude);

            if (needsLocation.length > 0) {
                console.log(`🔧 Setting location for ${needsLocation.length} online driver(s)...\n`);

                for (const driver of needsLocation) {
                    await driversCollection.updateOne(
                        { _id: driver._id },
                        {
                            $set: {
                                location: {
                                    latitude: 14.6819,
                                    longitude: 77.6006,
                                    lastUpdated: new Date()
                                }
                            }
                        }
                    );
                    console.log(`✅ Set location for ${driver.name}`);
                }
                console.log('');
            } else {
                console.log('✅ All online drivers have location data!\n');
            }
        }

        // Final status
        const updatedDrivers = await driversCollection.find({ isOnline: true }).toArray();
        const withLocation = updatedDrivers.filter(d => d.location?.latitude && d.location?.longitude);

        console.log('=== FINAL STATUS ===');
        console.log(`Online drivers: ${updatedDrivers.length}`);
        console.log(`Online with location: ${withLocation.length}\n`);

        if (withLocation.length > 0) {
            console.log('✅ SUCCESS! These drivers should now be visible:\n');
            withLocation.forEach((d, i) => {
                console.log(`${i + 1}. ${d.name}`);
                console.log(`   Email: ${d.email}`);
                console.log(`   Vehicle: ${d.vehicle?.type || 'N/A'}`);
                console.log(`   Location: (${d.location.latitude}, ${d.location.longitude})`);
                console.log('');
            });

            console.log('🔄 Now refresh the booking page to see the drivers!\n');
        } else {
            console.log('⚠️  Still no drivers available. Please check:\n');
            console.log('1. Is the backend server running?');
            console.log('2. Are you logged in as a user (not driver)?');
            console.log('3. Have you selected a pickup location?\n');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
        console.log('Database connection closed.');
    }
}

fixDriver();
