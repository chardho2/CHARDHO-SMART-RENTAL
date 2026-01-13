const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });
const User = require('./server/models/User');
const Driver = require('./server/models/Driver');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const dcoll = await Driver.find({ isOnline: true }).select('name vehicle.type');
    const ucoll = await User.find({ isOnline: true }).select('name vehicle.type role userType');
    console.log('--- ONLINE IN DRIVER COLL ---');
    console.log(JSON.stringify(dcoll, null, 2));
    console.log('--- ONLINE IN USER COLL ---');
    console.log(JSON.stringify(ucoll, null, 2));
    process.exit(0);
}
check();
