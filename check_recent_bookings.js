const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const Booking = require('./server/models/Booking');

async function listRecentBookings() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const bookings = await Booking.find({}).sort({ createdAt: -1 }).limit(5);
        console.log(`Found ${bookings.length} bookings`);

        bookings.forEach(b => {
            console.log(`- ID: ${b._id} | User: ${b.user} | Driver: ${b.driver} | Status: ${b.status} | Time: ${b.createdAt}`);
            console.log(`  From: ${b.pickup?.name} To: ${b.destination?.name}`);
            console.log(`  Fare Total: ${b.fare?.total}`);
        });

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
    }
}

listRecentBookings();
