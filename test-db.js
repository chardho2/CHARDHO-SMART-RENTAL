const mongoose = require('mongoose');
const fs = require('fs');

async function testConnection() {
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync('db-test.log', msg + '\n');
    };

    log(`Start Test: ${new Date().toISOString()}`);

    // CONFIGURATIONS TO TEST
    const configs = [
        {
            name: "SRV (Password: Muzamil789)",
            uri: "mongodb+srv://muzamilmohammadk:Muzamil789@cluster0.r2ah3ab.mongodb.net/?retryWrites=true&w=majority"
        },
        {
            name: "Standard (Password: Muzamil789)",
            uri: "mongodb://muzamilmohammadk:Muzamil789@cluster0-shard-00-00.r2ah3ab.mongodb.net:27017,cluster0-shard-00-01.r2ah3ab.mongodb.net:27017,cluster0-shard-00-02.r2ah3ab.mongodb.net:27017/?ssl=true&authSource=admin"
        },
        {
            name: "Standard (Password: Muzamil&789 - Encoded)",
            uri: "mongodb://muzamilmohammadk:Muzamil%26789@cluster0-shard-00-00.r2ah3ab.mongodb.net:27017,cluster0-shard-00-01.r2ah3ab.mongodb.net:27017,cluster0-shard-00-02.r2ah3ab.mongodb.net:27017/?ssl=true&authSource=admin"
        }
    ];

    for (const config of configs) {
        log(`\nTesting: ${config.name}`);
        try {
            await mongoose.connect(config.uri, {
                serverSelectionTimeoutMS: 5000,
                dbName: 'admin' // Connect to admin to test auth
            });
            log(`✅ SUCCESS! Connected using: ${config.name}`);
            log(`MATCH_URI=${config.uri}`); // Special marker
            process.exit(0);
        } catch (e) {
            log(`❌ Failed: ${e.message}`);
        }
    }

    log("All attempts failed.");
    process.exit(1);
}

testConnection();
