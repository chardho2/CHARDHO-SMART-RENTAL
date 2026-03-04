const mongoose = require('mongoose');
const fs = require('fs');
const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/car_rental_dev";

async function run() {
    try {
        await mongoose.connect(URI);
        const Driver = require('./models/Driver');
        const shaik = await Driver.findOne({ name: /Shaikh/i });
        const muzzu = await Driver.findOne({ name: /Muzzu/i });

        fs.writeFileSync('driver_full_check.txt', JSON.stringify({ shaik, muzzu }, null, 2));
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('driver_full_check.txt', err.stack);
        process.exit(1);
    }
}
run();
