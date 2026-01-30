const mongoose = require('mongoose');
const URI = "mongodb+srv://muzamilmohammadk:Muzamil789@cluster0.r2ah3ab.mongodb.net/?appName=Cluster0";

async function run() {
    try {
        await mongoose.connect(URI);
        const Driver = require('./models/Driver');

        const email = "shaikmuzzu600@gmail.com";
        const result = await Driver.updateOne(
            { email: email },
            {
                $set: {
                    isOnline: true,
                    isActive: true,
                    "location.latitude": 14.6819,
                    "location.longitude": 77.6006,
                    "location.lastUpdated": new Date()
                }
            }
        );
        console.log(`Updated driver ${email}:`, result);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
