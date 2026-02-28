const Driver = require('../../models/Driver');

module.exports = (io, socket) => {
    // Driver location update
    socket.on('driver:location', async ({ driverId, location, bookingId }) => {
        // Validation
        if (!driverId || !location) return;

        // 1. Update Database (So searches find them nearby)
        try {
            await Driver.findByIdAndUpdate(driverId, {
                location: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    type: 'Point',
                    coordinates: [location.longitude, location.latitude],
                    lastUpdated: new Date()
                }
            });
        } catch (e) {
            console.error(`❌ Failed to update location for driver ${driverId}: ${e.message}`);
        }

        // 2. Direct ride tracking (High Priority)
        if (bookingId) {
            socket.broadcast.emit('driver:location:update', {
                driverId,
                location,
                bookingId
            });
        }
    });
};
