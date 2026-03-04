const mongoose = require('mongoose');
const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/car_rental_dev";

// Minimal schemas to avoid dependency issues
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    role: String,
    userType: String,
    isOnline: Boolean,
    vehicle: Object,
    location: Object
}, { strict: false });

const DriverSchema = new mongoose.Schema({
    name: String,
    email: String,
    isOnline: Boolean,
    vehicle: Object,
    location: Object
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Driver = mongoose.models.Driver || mongoose.model('Driver', DriverSchema);

async function run() {
    try {
        await mongoose.connect(URI);
        console.log('Connected to MongoDB');

        console.log('\n--- DRIVER COLLECTION ---');
        const drivers = await Driver.find({});
        console.log('Total Drivers:', drivers.length);
        drivers.forEach(d => console.log(` - ${d.name} (${d.email}) Online: ${d.isOnline}`));

        console.log('\n--- USER COLLECTION (DRIVERS/ONLINE) ---');
        const users = await User.find({
            $or: [{ role: 'driver' }, { userType: 'driver' }, { isOnline: true }]
        });
        console.log('Total potential drivers in User collection:', users.length);
        users.forEach(u => console.log(` - ${u.name} (${u.email}) Online: ${u.isOnline} | Role: ${u.role} | Type: ${u.userType}`));

        console.log('\n--- SUMMARY ---');
        const onlineD = await Driver.countDocuments({ isOnline: true });
        const onlineU = await User.countDocuments({ isOnline: true });
        console.log('Total Online Drivers:', onlineD);
        console.log('Total Online Users:', onlineU);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}
run();
