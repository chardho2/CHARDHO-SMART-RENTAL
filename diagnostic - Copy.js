const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });
const User = require('./server/models/User');
const Driver = require('./server/models/Driver');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const shaikUser = await User.findOne({ name: /Shaik/i });
        const shaikDriver = await Driver.findOne({ name: /Shaik/i });
        const varaUser = await User.findOne({ name: /Vara/i });
        const varaDriver = await Driver.findOne({ name: /Vara/i });

        console.log('--- SHAIK ---');
        if (shaikUser) {
            console.log('User Collection:', {
                id: shaikUser._id,
                name: shaikUser.name,
                role: shaikUser.role,
                userType: shaikUser.userType,
                isOnline: shaikUser.isOnline
            });
        }
        if (shaikDriver) {
            console.log('Driver Collection:', {
                id: shaikDriver._id,
                name: shaikDriver.name,
                isOnline: shaikDriver.isOnline
            });
        }

        console.log('--- VARA ---');
        if (varaUser) {
            console.log('User Collection:', {
                id: varaUser._id,
                name: varaUser.name,
                role: varaUser.role,
                userType: varaUser.userType,
                isOnline: varaUser.isOnline
            });
        }
        if (varaDriver) {
            console.log('Driver Collection:', {
                id: varaDriver._id,
                name: varaDriver.name,
                isOnline: varaDriver.isOnline
            });
        }

        const onlineDriversCount = await Driver.countDocuments({ isOnline: true });
        const onlineUsersCount = await User.countDocuments({ isOnline: true });
        console.log(`Online: Drivers=${onlineDriversCount}, Users=${onlineUsersCount}`);

        const onlineDrivers = await Driver.find({ isOnline: true }).select('name');
        const onlineUsers = await User.find({ isOnline: true }).select('name');
        console.log('Online names (Drivers):', onlineDrivers.map(d => d.name));
        console.log('Online names (Users):', onlineUsers.map(u => u.name));

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

check();
