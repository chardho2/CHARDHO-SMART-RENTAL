module.exports = (io, socket) => {
    // Driver location update
    // Optimized: Only broadcast if bookingId is present (1-on-1 tracking)
    // For "view all drivers" feature, we might need a different strategy (spatial room)
    socket.on('driver:location', ({ driverId, location, bookingId }) => {
        // Validation
        if (!driverId || !location) return;

        // 1. Direct ride tracking (High Priority)
        if (bookingId) {
            // Broadcast to everyone in the context of this booking? 
            // Or usually just to the specific user if we had the userId.
            // Since the client emits bookingId, we broadcast to whoever is listening for that bookingId ?
            // Our current architecture broadcasts to ALL sockets but filters on client. 
            // Better: Emit to the specific user room if we knew it.
            // But 'socket.broadcast.emit' sends to everyone. This is BAD for scalability.
            // FIXME: scalable approach -> Send only to relevant User.

            // However, the current client implementation listens for global 'driver:location:update'.
            // For now, we keep it compatible but add a TODO for room-based optimization.

            socket.broadcast.emit('driver:location:update', {
                driverId,
                location,
                bookingId
            });
        }
    });
};
