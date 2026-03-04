const mongoose = require('mongoose');
const fs = require('fs');
const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/car_rental_dev";

async function run() {
    try {
        await mongoose.connect(URI);
        const User = require('./models/User');
        const vara = await User.findOne({ name: /Vara/i });

        fs.writeFileSync('vara_check.txt', JSON.stringify(vara, null, 2));
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('vara_check.txt', err.stack);
        process.exit(1);
    }
}
run();
