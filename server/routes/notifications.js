const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticateToken } = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get user's notifications with filtering and pagination
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const category = req.query.category;
        const priority = req.query.priority;
        const unreadOnly = req.query.unreadOnly === 'true';

        // Determine user type - check model name or userType field
        const userType = req.user.userType || (req.user.constructor.modelName === 'Driver' ? 'driver' : 'user');

        // Build query
        const query = {
            $or: [
                { recipient: req.user._id },
                { user: req.user._id }
            ],
            recipientType: userType
        };
        if (category) query.category = category;
        if (priority) query.priority = priority;
        if (unreadOnly) query.read = false;

        // Get total count for pagination
        const total = await Notification.countDocuments(query);

        // Fetch notifications
        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Get unread count
        const unreadCount = await Notification.getUnreadCount(req.user._id, userType);

        res.json({
            success: true,
            notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            },
            unreadCount
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const userType = req.user.userType || (req.user.constructor.modelName === 'Driver' ? 'driver' : 'user');
        const count = await Notification.getUnreadCount(req.user._id, userType);

        res.json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get unread count'
        });
    }
});

// @route   POST /api/notifications
// @desc    Create a new notification (admin/system use)
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { userId, title, message, type, category, priority, actionUrl, metadata, expiresAt } = req.body;

        // Validate required fields
        if (!userId || !title || !message) {
            return res.status(400).json({
                success: false,
                message: 'User ID, title, and message are required'
            });
        }

        const notification = await Notification.createNotification(userId, {
            title,
            message,
            type,
            category,
            priority,
            actionUrl,
            metadata,
            expiresAt
        });

        // Emit socket event for real-time notification
        const io = req.app.get('io');
        if (io) {
            io.to(userId.toString()).emit('new_notification', notification);
        }

        res.status(201).json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            $or: [{ recipient: req.user._id }, { user: req.user._id }]
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        await notification.markAsRead();

        // Get updated unread count
        const unreadCount = await Notification.getUnreadCount(req.user._id);

        res.json({
            success: true,
            notification,
            unreadCount
        });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notification'
        });
    }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', authenticateToken, async (req, res) => {
    try {
        const result = await Notification.updateMany(
            {
                $or: [
                    { recipient: req.user._id, read: false },
                    { user: req.user._id, read: false }
                ]
            },
            { $set: { read: true } }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount,
            unreadCount: 0
        });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notifications'
        });
    }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            $or: [{ recipient: req.user._id }, { user: req.user._id }]
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Get updated unread count
        const unreadCount = await Notification.getUnreadCount(req.user._id);

        res.json({
            success: true,
            message: 'Notification deleted',
            unreadCount
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification'
        });
    }
});

// @route   DELETE /api/notifications/clear-all
// @desc    Delete all read notifications
// @access  Private
router.delete('/clear-all', authenticateToken, async (req, res) => {
    try {
        console.log(`🗑️ Clearing all read notifications for user: ${req.user._id}`);
        const result = await Notification.deleteMany({
            $or: [
                { recipient: req.user._id, read: true },
                { user: req.user._id, read: true }
            ]
        });
        console.log(`✅ Cleared ${result.deletedCount} notifications`);

        res.json({
            success: true,
            message: 'All read notifications cleared',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Clear all error details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear notifications',
            error: error.message
        });
    }
});

// @route   GET /api/notifications/stats
// @desc    Get notification statistics
// @access  Private
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;
        const userType = req.user.userType || (req.user.constructor.modelName === 'Driver' ? 'driver' : 'user');
        const totalQuery = {
            $or: [
                { recipient: userId },
                { user: userId }
            ],
            recipientType: userType
        };
        const unreadQuery = {
            $or: [
                { recipient: userId, read: false },
                { user: userId, read: false }
            ],
            recipientType: userType
        };

        const [total, unread, byCategory, byPriority] = await Promise.all([
            Notification.countDocuments(totalQuery),
            Notification.countDocuments(unreadQuery),
            Notification.aggregate([
                { $match: totalQuery },
                { $group: { _id: '$category', count: { $sum: 1 } } }
            ]),
            Notification.aggregate([
                { $match: totalQuery },
                { $group: { _id: '$priority', count: { $sum: 1 } } }
            ])
        ]);

        res.json({
            success: true,
            stats: {
                total,
                unread,
                read: total - unread,
                byCategory: byCategory.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                byPriority: byPriority.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {})
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notification statistics'
        });
    }
});

module.exports = router;
