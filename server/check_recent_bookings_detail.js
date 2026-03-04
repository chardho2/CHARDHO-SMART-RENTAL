const mongoose = require('mongoose');
const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/car_rental_dev";

async function run() {
    try {
        await mongoose.connect(URI);
        // Register schemas
        require('./models/User');
        require('./models/Driver');
        const Booking = require('./models/Booking');

        console.log('--- RECENT BOOKINGS ---');
        const bookings = await Booking.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('driver', 'name email phone vehicle rating');

        bookings.forEach(b => {
            console.log(`Booking ID: ${b._id}`);
            console.log(`  User: ${b.user}`);
            console.log(`  Driver ID: ${b.driver ? b.driver._id : 'null'}`);
            console.log(`  Driver Name: ${b.driver ? (typeof b.driver === 'object' ? b.driver.name : 'ID Only') : 'N/A'}`);
            console.log(`  Status: ${b.status}`);
            console.log(`  Vehicle in Booking: ${JSON.stringify(b.rideType)}`);
            if (b.driver && typeof b.driver === 'object') {
                console.log(`  Driver Vehicle in DB: ${JSON.stringify(b.driver.vehicle)}`);
            }
            console.log('---');
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
