module.exports = (io, socket, connectedDrivers) => {
    // Driver connects with ID
    socket.on('driver:connect', (driverId) => {
        if (!driverId) {
            console.warn('⚠️ driver:connect called without driverId');
            return;
        }

        console.log(`🔌 Driver connection request: ${driverId} (socket: ${socket.id})`);

        // Store in connected drivers map
        connectedDrivers.set(driverId, socket.id);
        console.log(`📝 Added driver ${driverId} to connectedDrivers map`);

        // Join driver-specific room
        socket.join(`driver:${driverId}`);
        console.log(`🚪 Driver ${driverId} joined room: driver:${driverId}`);

        // Verify room membership
        const rooms = Array.from(socket.rooms);
        console.log(`✅ Driver ${driverId} is now in rooms: ${rooms.join(', ')}`);

        // Verify the room exists in the adapter
        const roomName = `driver:${driverId}`;
        const socketsInRoom = io.sockets.adapter.rooms.get(roomName);
        if (socketsInRoom && socketsInRoom.has(socket.id)) {
            console.log(`✅ Verified: Socket ${socket.id} is in room ${roomName}`);
        } else {
            console.error(`❌ ERROR: Socket ${socket.id} NOT found in room ${roomName}!`);
        }

        socket.emit('connection:success', {
            message: 'Connected to driver system',
            driverId,
            socketId: socket.id,
            rooms: rooms
        });

        console.log(`✅ Driver ${driverId} connected successfully`);
    });

    // Driver goes online
    socket.on('driver:online', (driverId) => {
        if (!driverId) return;
        console.log(`Driver ${driverId} is online`);
        socket.broadcast.emit('driver:status', { driverId, status: 'online' });
    });

    // Driver goes offline
    socket.on('driver:offline', (driverId) => {
        if (!driverId) return;
        console.log(`Driver ${driverId} is offline`);
        socket.broadcast.emit('driver:status', { driverId, status: 'offline' });
    });

    // Driver accepts booking (Fallback generic handler if logic is simple)
    socket.on('booking:accept', ({ bookingId, driverId, userId }) => {
        if (!bookingId || !driverId || !userId) return;
        console.log(`Driver ${driverId} accepted booking ${bookingId}`);
        io.to(`user:${userId}`).emit('booking:accepted', {
            bookingId,
            driverId,
            message: 'Driver accepted your ride request'
        });
    });


};
