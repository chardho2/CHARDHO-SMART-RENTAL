const mongoose = require('mongoose');
const fs = require('fs');
const URI = "mongodb+srv://muzamilmohammadk:Muzamil789@cluster0.r2ah3ab.mongodb.net/?appName=Cluster0";

async function run() {
    let out = "";
    const log = (msg) => {
        out += msg + "\n";
        console.log(msg);
    };

    try {
        log('Connecting to MongoDB...');
        await mongoose.connect(URI);
        log('Connected');

        const User = require('./models/User');
        const Driver = require('./models/Driver');

        const shaikU = await User.findOne({ name: /Shaik/i });
        log('Shaik (User): ' + (shaikU ? JSON.stringify({
            id: shaikU._id,
            name: shaikU.name,
            role: shaikU.role,
            userType: shaikU.userType,
            isOnline: shaikU.isOnline
        }, null, 2) : 'NOT FOUND'));

        const shaikD = await Driver.findOne({ name: /Shaik/i });
        log('Shaik (Driver): ' + (shaikD ? JSON.stringify({
            id: shaikD._id,
            name: shaikD.name,
            isOnline: shaikD.isOnline
        }, null, 2) : 'NOT FOUND'));

        const onlineUsers = await User.find({ isOnline: true }).select('name role userType email');
        log('Online Users in User Coll: ' + JSON.stringify(onlineUsers, null, 2));

        const onlineDrivers = await Driver.find({ isOnline: true }).select('name email');
        log('Online Drivers in Driver Coll: ' + JSON.stringify(onlineDrivers, null, 2));

        fs.writeFileSync('db_check_results.txt', out);
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('db_check_results.txt', 'ERROR: ' + err.stack);
        process.exit(1);
    }
}
run();
