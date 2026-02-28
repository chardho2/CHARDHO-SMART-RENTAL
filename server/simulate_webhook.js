const mongoose = require('mongoose');
const crypto = require('crypto');
const fs = require('fs');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config({ path: __dirname + '/.env' });

const Driver = require('./models/Driver');
const Booking = require('./models/Booking');
const Wallet = require('./models/Wallet');
const paymentController = require('./controllers/paymentController');

async function simulate() {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        log('🚀 Simulation Started');
        await mongoose.connect(process.env.MONGODB_URI);
        log('✅ DB Connected');

        const driver = await Driver.findOne();
        if (!driver) throw new Error('No driver found to test with');

        const booking = await Booking.findOne({ driver: driver._id });
        if (!booking) throw new Error('No booking found for driver ' + driver._id);

        const wallet = await Wallet.getOrCreate(driver._id);
        const initialBalance = wallet.balance;

        const paymentId = 'pay_sim_' + Date.now();
        const payload = {
            event: 'payment.captured',
            payload: { payment: { entity: { id: paymentId, amount: 10000, currency: 'INR', status: 'captured', notes: { driverId: driver._id.toString(), bookingId: booking._id.toString() } } } }
        };

        const jsonBody = JSON.stringify(payload);
        const signature = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || 'set_your_own_secure_webhook_secret').update(jsonBody).digest('hex');

        const req = { headers: { 'x-razorpay-signature': signature }, body: payload, rawBody: jsonBody };
        const res = { json: () => res, status: () => res };

        await paymentController.handleWebhook(req, res);

        const updatedWallet = await Wallet.findOne({ driver: driver._id });
        log('📊 Initial Balance: ' + initialBalance);
        log('� New Balance: ' + updatedWallet.balance);
        log('✅ Simulation Completed');

        fs.writeFileSync('sim_result.txt', output);
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('sim_result.txt', 'ERROR: ' + err.message);
        process.exit(1);
    }
}
simulate();
