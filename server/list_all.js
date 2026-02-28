const mongoose = require('mongoose');
const fs = require('fs');
const URI = "mongodb+srv://muzamilmohammadk:Muzamil789@cluster0.r2ah3ab.mongodb.net/?appName=Cluster0";

async function run() {
    try {
        await mongoose.connect(URI);
        const User = require('./models/User');
        const Driver = require('./models/Driver');

        const allDrivers = await Driver.find({}).select('name email');
        const allUsers = await User.find({ role: 'driver' }).select('name email');

        fs.writeFileSync('all_drivers_list.txt', JSON.stringify({ allDrivers, allUsers }, null, 2));
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('all_drivers_list.txt', err.stack);
        process.exit(1);
    }
}
run();
