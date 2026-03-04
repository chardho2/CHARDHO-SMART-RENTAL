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
        { name: "Primary URI", uri: process.env.MONGODB_URI },
        { name: "Fallback URI 1", uri: process.env.MONGODB_URI_FALLBACK_1 },
        { name: "Fallback URI 2", uri: process.env.MONGODB_URI_FALLBACK_2 }
    ].filter(c => !!c.uri);

    if (configs.length === 0) {
        log("No MongoDB URI configured. Set MONGODB_URI (and optional fallback vars).");
        process.exit(1);
    }

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
