const fs = require('fs');
const path = require('path');

try {
    console.log('Starting check script...');
    require('dotenv').config({ path: path.join(__dirname, '.env') });
    console.log('Dotenv loaded.');

    const mongoose = require('mongoose');
    const User = require('./models/User');
    const Driver = require('./models/Driver');

    const uri = process.env.MONGODB_URI;
    console.log('URI:', uri ? uri.substring(0, 20) + '...' : 'UNDEFINED');

    if (!uri) {
        throw new Error('MONGODB_URI is undefined');
    }

    mongoose.connect(uri)
        .then(async () => {
            console.log('Connected to DB');

            const users = await User.find({});
            console.log(`Found ${users.length} users.`);

            const drivers = await Driver.find({});
            console.log(`Found ${drivers.length} drivers.`);

            process.exit(0);
        })
        .catch(err => {
            console.error('DB Connection Error:', err);
            process.exit(1);
        });

} catch (err) {
    console.error('Runtime Error:', err);
    process.exit(1);
}
