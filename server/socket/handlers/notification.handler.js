const Notification = require('../../models/Notification');

/**
 * Notification Socket Handler
 * Handles real-time notification events
 */
module.exports = (io, socket, connectedUsers, connectedDrivers) => {
    console.log('📢 Notification handler initialized for socket:', socket.id);

    // Listen for notification acknowledgment
    socket.on('notification:read', async (data) => {
        try {
            const { notificationId, userId } = data;
            console.log(`📖 Notification ${notificationId} marked as read by user ${userId}`);

            // Update notification in database
            await Notification.findByIdAndUpdate(notificationId, { read: true });

            // Emit confirmation back to the user
            socket.emit('notification:read:success', { notificationId });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            socket.emit('notification:read:error', { error: error.message });
        }
    });

    // Listen for notification deletion
    socket.on('notification:delete', async (data) => {
        try {
            const { notificationId, userId } = data;
            console.log(`🗑️ Notification ${notificationId} deleted by user ${userId}`);

            // Delete notification from database
            await Notification.findByIdAndDelete(notificationId);

            // Emit confirmation back to the user
            socket.emit('notification:delete:success', { notificationId });
        } catch (error) {
            console.error('Error deleting notification:', error);
            socket.emit('notification:delete:error', { error: error.message });
        }
    });

    // Listen for mark all as read
    socket.on('notification:mark_all_read', async (data) => {
        try {
            const { userId } = data;
            console.log(`📖 Marking all notifications as read for user ${userId}`);

            // Update all notifications for the user
            await Notification.updateMany(
                {
                    $or: [{ recipient: userId }, { user: userId }],
                    read: false
                },
                { read: true }
            );

            // Emit confirmation back to the user
            socket.emit('notification:mark_all_read:success', { userId });
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            socket.emit('notification:mark_all_read:error', { error: error.message });
        }
    });
};

/**
 * Send notification to a specific user
 * @param {Object} io - Socket.io instance
 * @param {String} userId - User ID to send notification to
 * @param {Object} notification - Notification data
 */
const sendNotificationToUser = (io, userId, notification) => {
    if (!io) {
        console.error('Socket.io not initialized');
        return;
    }

    const roomName = `user:${userId}`;
    console.log(`📤 Sending notification to user ${userId} in room ${roomName}`);

    io.to(roomName).emit('new_notification', {
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        category: notification.category,
        priority: notification.priority,
        read: notification.read,
        actionUrl: notification.actionUrl,
        metadata: notification.metadata,
        createdAt: notification.createdAt
    });
};

/**
 * Send notification to a specific driver
 * @param {Object} io - Socket.io instance
 * @param {String} driverId - Driver ID to send notification to
 * @param {Object} notification - Notification data
 */
const sendNotificationToDriver = (io, driverId, notification) => {
    if (!io) {
        console.error('Socket.io not initialized');
        return;
    }

    const roomName = `driver:${driverId}`;
    console.log(`📤 Sending notification to driver ${driverId} in room ${roomName}`);

    io.to(roomName).emit('new_notification', {
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        category: notification.category,
        priority: notification.priority,
        read: notification.read,
        actionUrl: notification.actionUrl,
        metadata: notification.metadata,
        createdAt: notification.createdAt
    });
};

/**
 * Broadcast notification to all users
 * @param {Object} io - Socket.io instance
 * @param {Object} notification - Notification data
 */
const broadcastNotificationToAllUsers = (io, notification) => {
    if (!io) {
        console.error('Socket.io not initialized');
        return;
    }

    console.log(`📢 Broadcasting notification to all users`);

    io.emit('new_notification', {
        _id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        category: notification.category,
        priority: notification.priority,
        read: notification.read,
        actionUrl: notification.actionUrl,
        metadata: notification.metadata,
        createdAt: notification.createdAt
    });
};

module.exports.sendNotificationToUser = sendNotificationToUser;
module.exports.sendNotificationToDriver = sendNotificationToDriver;
module.exports.broadcastNotificationToAllUsers = broadcastNotificationToAllUsers;
