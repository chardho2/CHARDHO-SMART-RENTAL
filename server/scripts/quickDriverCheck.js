const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/chradhogo', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB');

    // Get Driver model
    const Driver = mongoose.model('Driver');

    // Find all drivers
    const allDrivers = await Driver.find({});
    console.log(`\nTotal drivers: ${allDrivers.length}`);

    // Find online drivers
    const onlineDrivers = await Driver.find({ isOnline: true });
    console.log(`Online drivers: ${onlineDrivers.length}`);

    if (onlineDrivers.length > 0) {
        console.log('\nOnline drivers:');
        onlineDrivers.forEach((d, i) => {
            console.log(`${i + 1}. ${d.name} (${d.email})`);
            console.log(`   Online: ${d.isOnline}`);
            console.log(`   Location: ${d.location?.latitude ? `${d.location.latitude}, ${d.location.longitude}` : 'NO LOCATION'}`);
            console.log(`   Vehicle: ${d.vehicle?.type || 'N/A'}`);
        });
    } else {
        console.log('\n⚠️ NO ONLINE DRIVERS FOUND!');
        console.log('\nAll drivers:');
        allDrivers.forEach((d, i) => {
            console.log(`${i + 1}. ${d.name} (${d.email}) - Online: ${d.isOnline}`);
        });
    }

    await mongoose.connection.close();
    process.exit(0);
}).catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
});
