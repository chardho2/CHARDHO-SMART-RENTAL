const Driver = require('../../models/Driver');

module.exports = (io, socket, connectedDrivers) => {
    // Driver connects with ID
    socket.on('driver:connect', async (driverIdRaw) => {
        if (!driverIdRaw) {
            console.warn('⚠️ driver:connect called without driverId');
            return;
        }

        const driverId = driverIdRaw.toString();
        console.log(`🔌 Driver connection request: ${driverId} (socket: ${socket.id})`);

        // Store in connected drivers map
        connectedDrivers.set(driverId, socket.id);

        // Update DB status to online
        try {
            await Driver.findByIdAndUpdate(driverId, { isOnline: true });
            console.log(`✅ Driver ${driverId} set to isOnline: true in DB`);
        } catch (e) {
            console.error(`❌ Failed to update driver ${driverId} status: ${e.message}`);
        }

        // Join driver-specific room
        socket.join(`driver:${driverId}`);

        socket.emit('connection:success', {
            message: 'Connected to driver system',
            driverId,
            socketId: socket.id
        });
    });

    // Driver goes online
    socket.on('driver:online', async (driverId) => {
        if (!driverId) return;
        console.log(`Driver ${driverId} is online`);
        try {
            await Driver.findByIdAndUpdate(driverId, { isOnline: true });
            socket.broadcast.emit('driver:status', { driverId, status: 'online' });
        } catch (e) { console.error(e); }
    });

    // Driver goes offline
    socket.on('driver:offline', async (driverId) => {
        if (!driverId) return;
        console.log(`Driver ${driverId} is offline`);
        try {
            await Driver.findByIdAndUpdate(driverId, { isOnline: false });
            socket.broadcast.emit('driver:status', { driverId, status: 'offline' });
        } catch (e) { console.error(e); }
    });

    // Handle disconnection to set offline (Optional but recommended)
    socket.on('disconnect', async () => {
        // Find which driver disconnected
        for (const [driverId, socketId] of connectedDrivers.entries()) {
            if (socketId === socket.id) {
                console.log(`🔌 Automated offline: Driver ${driverId} socket disconnected`);
                try {
                    await Driver.findByIdAndUpdate(driverId, { isOnline: false });
                    socket.broadcast.emit('driver:status', { driverId, status: 'offline' });
                } catch (e) { }
                break;
            }
        }
    });

    // Driver accepts booking
    socket.on('booking:accept', async ({ bookingId, driverId, userId }) => {
        if (!bookingId || !driverId || !userId) return;
        console.log(`Driver ${driverId} accepted booking ${bookingId}`);
        io.to(`user:${userId.toString()}`).emit('booking:accepted', {
            bookingId,
            driverId,
            message: 'Driver accepted your ride request'
        });
    });
};
