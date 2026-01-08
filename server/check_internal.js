const mongoose = require('mongoose');
const URI = "mongodb+srv://muzamilmohammadk:Muzamil789@cluster0.r2ah3ab.mongodb.net/?appName=Cluster0";

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(URI);
        console.log('Connected');

        const User = require('./models/User');
        const Driver = require('./models/Driver');

        const driversCount = await Driver.countDocuments({});
        console.log('Drivers Count:', driversCount);

        const shaikD = await Driver.findOne({ name: /Shaik/i });
        if (shaikD) console.log('Shaik (Driver):', JSON.stringify(shaikD, null, 2));

        const usersCount = await User.countDocuments({});
        console.log('Users Count:', usersCount);

        const shaikU = await User.findOne({ name: /Shaik/i });
        if (shaikU) console.log('Shaik (User):', JSON.stringify(shaikU, null, 2));

        const onlineUsers = await User.find({ isOnline: true }).select('name role userType email');
        console.log('Online Users:', JSON.stringify(onlineUsers, null, 2));

        const onlineDrivers = await Driver.find({ isOnline: true }).select('name email');
        console.log('Online Drivers:', JSON.stringify(onlineDrivers, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
