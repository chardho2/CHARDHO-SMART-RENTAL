const mongoose = require('mongoose');
const fs = require('fs');
const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/car_rental_dev";

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
