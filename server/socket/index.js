const socketIO = require('socket.io');

let io;

// Store connected drivers and users
const connectedDrivers = new Map(); // driverId -> socketId
const connectedUsers = new Map();   // userId -> socketId

const initializeSocket = (server) => {
    io = socketIO(server, {
        transports: ['polling', 'websocket'], // Explicitly allow both
        cors: {
            origin: "*", // In production, specify your frontend URL
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    console.log('socket.io initialized with transports: polling, websocket');

    io.on('connection', (socket) => {
        console.log(`New client connected: ${socket.id} via ${socket.conn.transport.name}`);

        // Register Handlers
        require('./handlers/driver.handler')(io, socket, connectedDrivers);
        require('./handlers/user.handler')(io, socket, connectedUsers);
        require('./handlers/location.handler')(io, socket);
        require('./handlers/notification.handler')(io, socket, connectedUsers, connectedDrivers);

        // Disconnect
        socket.on('disconnect', (reason) => {
            console.log(`Client disconnected: ${socket.id} reason: ${reason}`);

            // Remove from connected drivers
            for (const [driverId, socketId] of connectedDrivers.entries()) {
                if (socketId === socket.id) {
                    connectedDrivers.delete(driverId);
                    console.log(`Driver ${driverId} disconnected`);
                    break;
                }
            }

            // Remove from connected users
            for (const [userId, socketId] of connectedUsers.entries()) {
                if (socketId === socket.id) {
                    connectedUsers.delete(userId);
                    console.log(`User ${userId} disconnected`);
                    break;
                }
            }
        });
    });

    return io;
};

// Emit new booking to nearby drivers
const emitNewBooking = (booking, nearbyDriverIds) => {
    if (!io) {
        console.error('Socket.io not initialized');
        return;
    }

    console.log(`📢 Emitting new booking ${booking._id} to ${nearbyDriverIds.length} drivers`);

    nearbyDriverIds.forEach(driverId => {
        const roomName = `driver:${driverId}`;

        // Check if driver is connected
        const socketId = connectedDrivers.get(driverId);

        if (!socketId) {
            console.warn(`⚠️ Driver ${driverId} not in connectedDrivers map`);
        } else {
            console.log(`✅ Driver ${driverId} is connected with socket ${socketId}`);
        }

        // Get all sockets in the driver's room
        const socketsInRoom = io.sockets.adapter.rooms.get(roomName);

        if (!socketsInRoom || socketsInRoom.size === 0) {
            console.warn(`⚠️ No sockets in room ${roomName} for driver ${driverId}`);

            // Fallback: Try to emit directly to the socket if we have the socketId
            if (socketId) {
                const socket = io.sockets.sockets.get(socketId);
                if (socket) {
                    console.log(`🔄 Fallback: Emitting directly to socket ${socketId}`);
                    socket.emit('booking:new', {
                        bookingId: booking._id,
                        user: {
                            name: booking.user?.name || 'Customer',
                            phone: booking.user?.phone || 'N/A'
                        },
                        pickup: booking.pickup,
                        destination: booking.destination,
                        rideType: booking.rideType,
                        fare: booking.fare,
                        estimatedTime: booking.estimatedTime,
                        distance: booking.fare?.distance || booking.distance || 0,
                        createdAt: booking.createdAt
                    });
                } else {
                    console.error(`❌ Socket ${socketId} not found for driver ${driverId}`);
                }
            }
        } else {
            console.log(`✅ Room ${roomName} has ${socketsInRoom.size} socket(s): ${Array.from(socketsInRoom).join(', ')}`);

            // Emit to room
            io.to(roomName).emit('booking:new', {
                bookingId: booking._id,
                user: {
                    name: booking.user?.name || 'Customer',
                    phone: booking.user?.phone || 'N/A'
                },
                pickup: booking.pickup,
                destination: booking.destination,
                rideType: booking.rideType,
                fare: booking.fare,
                estimatedTime: booking.estimatedTime,
                distance: booking.fare?.distance || booking.distance || 0,
                createdAt: booking.createdAt
            });

            console.log(`📤 Emitted booking:new to room ${roomName}`);
        }
    });
};

// Notify user about booking status
const notifyUser = (userId, event, data) => {
    if (!io) {
        console.error('Socket.io not initialized');
        return;
    }

    io.to(`user:${userId}`).emit(event, data);
};

// Notify driver about booking status
const notifyDriver = (driverId, event, data) => {
    if (!io) {
        console.error('Socket.io not initialized');
        return;
    }

    io.to(`driver:${driverId}`).emit(event, data);
};

// Get connected drivers count
const getConnectedDriversCount = () => {
    return connectedDrivers.size;
};

// Get connected users count
const getConnectedUsersCount = () => {
    return connectedUsers.size;
};

// Check if driver is connected
const isDriverConnected = (driverId) => {
    return connectedDrivers.has(driverId);
};

// Check if user is connected
const isUserConnected = (userId) => {
    return connectedUsers.has(userId);
};

// Get list of connected drivers (for debugging)
const getConnectedDriversList = () => {
    return Array.from(connectedDrivers.entries()).map(([driverId, socketId]) => ({
        driverId,
        socketId
    }));
};

// Broadcast driver status update
const broadcastDriverStatus = (driverId, status, location = null) => {
    if (!io) {
        console.error('Socket.io not initialized');
        return;
    }

    const payload = {
        driverId,
        status,
        ...(location && { location })
    };

    console.log(`Broadcasting driver status: ${driverId} is ${status}`);
    io.emit('driver:status', payload);
};

// Debug: Print all socket rooms
const debugSocketRooms = () => {
    if (!io) {
        console.error('Socket.io not initialized');
        return;
    }

    console.log('=== SOCKET ROOMS DEBUG ===');
    console.log(`Connected Drivers: ${connectedDrivers.size}`);
    console.log(`Connected Users: ${connectedUsers.size}`);

    const rooms = io.sockets.adapter.rooms;
    console.log(`Total Rooms: ${rooms.size}`);

    rooms.forEach((sockets, roomName) => {
        console.log(`Room "${roomName}": ${sockets.size} socket(s) - ${Array.from(sockets).join(', ')}`);
    });

    console.log('=========================');
};

// Get IO instance
const getIO = () => io;

// Import notification helpers
const notificationHandler = require('./handlers/notification.handler');

module.exports = {
    initializeSocket,
    emitNewBooking,
    notifyUser,
    notifyDriver,
    broadcastDriverStatus,
    getConnectedDriversCount,
    getConnectedUsersCount,
    isDriverConnected,
    isUserConnected,
    getConnectedDriversList,
    debugSocketRooms,
    getIO,
    // Notification functions
    sendNotificationToUser: notificationHandler.sendNotificationToUser,
    sendNotificationToDriver: notificationHandler.sendNotificationToDriver,
    broadcastNotificationToAllUsers: notificationHandler.broadcastNotificationToAllUsers
};
