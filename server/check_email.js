const mongoose = require('mongoose');
const fs = require('fs');
const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/car_rental_dev";

async function run() {
    try {
        await mongoose.connect(URI);
        const User = require('./models/User');
        const Driver = require('./models/Driver');

        const varaEmail = "maddanavaraprasadmec092@gmail.com";
        const u = await User.findOne({ email: varaEmail });
        const d = await Driver.findOne({ email: varaEmail });

        fs.writeFileSync('email_check.txt', JSON.stringify({ u, d }, null, 2));
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('email_check.txt', err.stack);
        process.exit(1);
    }
}
run();
