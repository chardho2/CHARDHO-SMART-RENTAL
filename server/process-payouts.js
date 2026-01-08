/**
 * PROCESS PAYOUTS SCRIPT
 * 
 * This script is designed to be run as a cron job (daily at 2:00 AM).
 * It finds all completed bookings that have 'matured' (passed their 24h payout eligibility window)
 * and processes them for payout to the driver.
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const payoutService = require('./services/payoutService');

// DB Connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chardhogo');
        console.log('✅ MongoDB Connected for Payout Script');
    } catch (err) {
        console.error('❌ DB Connection Error:', err);
        process.exit(1);
    }
};

const processPayouts = async () => {
    console.log(`\n💰 STARTING PAYOUT PROCESS [${new Date().toISOString()}]`);

    try {
        const result = await payoutService.processEligiblePayouts();

        console.log(`\n📊 Payout Summary:`);
        console.log(`   - Eligible Bookings: ${result.eligibleBookings}`);
        console.log(`   - Drivers Processed: ${result.processedCount}`);
        console.log(`   - Total Paid Out: ₹${result.totalAmount.toFixed(2)}`);
        console.log(`\n🏁 Payout Run Complete.`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Payout Script Failed:', error);
        process.exit(1);
    }
};

// Run
connectDB().then(processPayouts);
