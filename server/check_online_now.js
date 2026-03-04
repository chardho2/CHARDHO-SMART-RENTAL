const mongoose = require('mongoose');
const fs = require('fs');
const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/car_rental_dev";

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
