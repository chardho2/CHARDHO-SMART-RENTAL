module.exports = (io, socket, connectedUsers) => {
    // User connects
    socket.on('user:connect', (userIdRaw) => {
        if (!userIdRaw) return;
        const userId = userIdRaw.toString();
        connectedUsers.set(userId, socket.id);
        socket.join(`user:${userId}`);
        console.log(`✅ User ${userId} connected`);

        socket.emit('connection:success', {
            message: 'Connected to booking system',
            userId
        });
    });
};
