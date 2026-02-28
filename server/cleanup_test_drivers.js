const mongoose = require('mongoose');
const URI = "mongodb+srv://muzamilmohammadk:Muzamil789@cluster0.r2ah3ab.mongodb.net/?appName=Cluster0";
const Driver = require('./models/Driver');

async function cleanup() {
    try {
        await mongoose.connect(URI);
        console.log('Connected to MongoDB');

        // Records to remove
        const emailsToRemove = [
            'dinesh@example.com',
            'kalam@example.com',
            'ansar@example.com'
        ];

        const result = await Driver.deleteMany({ email: { $in: emailsToRemove } });
        console.log(`✅ Removed ${result.deletedCount} test driver accounts.`);

        // Note: Shaikh is a real account (shaikmuzzu600@gmail.com), 
        // but if the user wants it cleaned up or reset, we can do that here.
        // For now, only removing the explicit @example.com accounts I created.

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
cleanup();
