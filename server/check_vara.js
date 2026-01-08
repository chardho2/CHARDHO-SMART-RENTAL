const mongoose = require('mongoose');
const fs = require('fs');
const URI = "mongodb+srv://muzamilmohammadk:Muzamil789@cluster0.r2ah3ab.mongodb.net/?appName=Cluster0";

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
