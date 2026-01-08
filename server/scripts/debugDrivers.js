const mongoose = require('mongoose');
const Driver = require('../models/Driver');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/chradhogo')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

async function checkDrivers() {
    try {
        console.log('\n--- Checking Driver Collection ---');
        const drivers = await Driver.find({ isOnline: true });
        console.log(`Found ${drivers.length} ONLINE drivers in Driver collection`);

        drivers.forEach(d => {
            console.log(`Driver: ${d.name} (${d._id})`);
            console.log(` - Online: ${d.isOnline}`);
            console.log(` - Active: ${d.isActive}`);
            console.log(` - Vehicle:`, d.vehicle);
            console.log(` - Location:`, d.location);
        });

        console.log('\n--- Checking User Collection (Legacy) ---');
        const users = await User.find({ isOnline: true, role: 'driver' });
        console.log(`Found ${users.length} ONLINE drivers in User collection`);

        users.forEach(u => {
            console.log(`User: ${u.name} (${u._id})`);
            console.log(` - Online: ${u.isOnline}`);
            console.log(` - Role: ${u.role}`);
            console.log(` - Vehicle:`, u.vehicle);
            console.log(` - Location:`, u.location); // Check if location exists on User schema
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

checkDrivers();
