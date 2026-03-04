const mongoose = require('mongoose');
const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/car_rental_dev";

async function run() {
    try {
        await mongoose.connect(URI);
        const Driver = require('./models/Driver');

        const shaik = await Driver.findOne({ name: /Shaikh/i });
        if (shaik) {
            shaik.vehicle = {
                type: 'bike',
                model: 'Hero Splendor',
                plateNumber: 'AP-02-XY-1234',
                color: 'Black',
                year: 2022
            };
            await shaik.save();
            console.log('✅ Updated Shaikh with vehicle info');
        }

        const muzzu = await Driver.findOne({ name: /Muzzu/i });
        if (muzzu) {
            muzzu.vehicle = {
                type: 'car',
                model: 'Swift Dzire',
                plateNumber: 'AP-02-YZ-5678',
                color: 'White',
                year: 2021
            };
            await muzzu.save();
            console.log('✅ Updated Muzzu with vehicle info');
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
