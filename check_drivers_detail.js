const mongoose = require('mongoose');
const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/car_rental_dev";

async function run() {
    try {
        await mongoose.connect(URI);
        const Driver = require('./server/models/Driver');
        const User = require('./server/models/User');

        console.log('--- ALL DRIVERS ---');
        const drivers = await Driver.find({});
        drivers.forEach(d => {
            console.log(`Driver: ${d.name} (${d.email})`);
            console.log(`  isOnline: ${d.isOnline}`);
            console.log(`  location: ${JSON.stringify(d.location)}`);
            console.log(`  vehicle: ${JSON.stringify(d.vehicle)}`);
            console.log('---');
        });

        console.log('--- ALL USERS (LEGACY DRIVERS) ---');
        const users = await User.find({ isOnline: true });
        users.forEach(u => {
            console.log(`User: ${u.name} (${u.email})`);
            console.log(`  isOnline: ${u.isOnline}`);
            console.log(`  location: ${JSON.stringify(u.location)}`);
            console.log(`  vehicle: ${JSON.stringify(u.vehicle)}`);
            console.log('---');
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
