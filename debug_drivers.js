const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const User = require('./server/models/User');
const Driver = require('./server/models/Driver');

async function debugDrivers() {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI.substring(0, 20) + '...');
        await mongoose.connect(process.env.MONGODB_URI);

        console.log('--- ALL DRIVER COLLECTION ---');
        const drivers = await Driver.find({});
        drivers.forEach(d => {
            console.log(`- ${d.name} (${d.email}) | Online: ${d.isOnline} | Loc: ${d.location?.latitude ? 'YES' : 'NO'}`);
        });

        console.log('\n--- ALL USER COLLECTION (DRIVERS) ---');
        const users = await User.find({
            $or: [{ role: 'driver' }, { userType: 'driver' }, { isOnline: true }]
        });
        users.forEach(u => {
            console.log(`- ${u.name} (${u.email}) | Online: ${u.isOnline} | Role: ${u.role} | Type: ${u.userType} | Loc: ${u.location?.latitude ? 'YES' : 'NO'}`);
        });

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

debugDrivers();
