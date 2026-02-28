const mongoose = require('mongoose');
const User = require('./models/User');
const Driver = require('./models/Driver');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
    .then(async () => {
        console.log('Connected to DB');
        console.log('Checking Users...');
        const users = await User.find({});
        console.log(`Found ${users.length} users.`);
        if (users.length > 0) {
            console.log('Sample User:', { email: users[0].email, userType: users[0].userType });
        }

        console.log('Checking Drivers...');
        const drivers = await Driver.find({});
        console.log(`Found ${drivers.length} drivers.`);
        if (drivers.length > 0) {
            console.log('Sample Driver:', { email: drivers[0].email, isActive: drivers[0].isActive });
        }

        process.exit(0);
    })
    .catch(err => {
        console.error('DB Error:', err);
        process.exit(1);
    });
