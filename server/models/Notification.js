const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    recipientType: {
        type: String,
        enum: ['user', 'driver'],
        required: true,
        default: 'user'
    },
    // Legacy field for backward compatibility
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: [
            'info',
            'alert',
            'success',
            'warning',
            'error',
            'ride_request',
            'ride_accepted',
            'ride_started',
            'ride_completed',
            'ride_cancelled',
            'payment_received',
            'payment_pending',
            'document_verified',
            'document_rejected',
            'profile_update',
            'system_update',
            'promotion',
            'missed_ride'
        ],
        default: 'info'
    },
    category: {
        type: String,
        enum: ['ride', 'payment', 'account', 'system', 'promotion'],
        default: 'system'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    read: {
        type: Boolean,
        default: false,
        index: true
    },
    actionUrl: {
        type: String,
        trim: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    expiresAt: {
        type: Date,
        index: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to create notification
notificationSchema.statics.createNotification = async function (recipientId, data, recipientType = 'user') {
    try {
        const notification = await this.create({
            recipient: recipientId,
            recipientType: recipientType,
            user: recipientType === 'user' ? recipientId : undefined, // For backward compatibility
            title: data.title,
            message: data.message,
            type: data.type || 'info',
            category: data.category || 'system',
            priority: data.priority || 'medium',
            actionUrl: data.actionUrl,
            metadata: data.metadata || {},
            expiresAt: data.expiresAt
        });
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function (recipientId, recipientType) {
    try {
        const query = {
            read: false,
            $or: [
                { recipient: recipientId },
                { user: recipientId } // For backward compatibility
            ]
        };

        if (recipientType) {
            query.recipientType = recipientType;
        }

        const count = await this.countDocuments(query);
        return count;
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function () {
    this.read = true;
    return await this.save();
};

module.exports = mongoose.model('Notification', notificationSchema);
