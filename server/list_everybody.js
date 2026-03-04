const mongoose = require('mongoose');
const fs = require('fs');
const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/car_rental_dev";

async function run() {
    try {
        await mongoose.connect(URI);
        const User = require('./models/User');
        const Driver = require('./models/Driver');

        const allU = await User.find({}).select('name email role userType isOnline');
        const allD = await Driver.find({}).select('name email isOnline');

        fs.writeFileSync('complete_user_list.txt', JSON.stringify({
            users: allU,
            drivers: allD
        }, null, 2));
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('complete_user_list.txt', err.stack);
        process.exit(1);
    }
}
run();
