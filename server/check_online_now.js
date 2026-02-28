const mongoose = require('mongoose');
const fs = require('fs');
const URI = "mongodb+srv://muzamilmohammadk:Muzamil789@cluster0.r2ah3ab.mongodb.net/?appName=Cluster0";

async function run() {
    try {
        await mongoose.connect(URI);
        const User = require('./models/User');
        const Driver = require('./models/Driver');

        const onlineDrivers = await Driver.find({ isOnline: true }).select('name email');
        const onlineUsers = await User.find({ isOnline: true }).select('name email');

        fs.writeFileSync('online_status_check.txt', JSON.stringify({ onlineDrivers, onlineUsers }, null, 2));
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('online_status_check.txt', err.stack);
        process.exit(1);
    }
}
run();
