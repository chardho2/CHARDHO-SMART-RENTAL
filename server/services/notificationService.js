const Notification = require('../models/Notification');
const { sendNotificationToUser, sendNotificationToDriver } = require('../socket');

/**
 * Notification Service
 * Handles creation and real-time delivery of notifications
 */

class NotificationService {
    /**
     * Create and send notification to a user
     */
    static async notifyUser(io, userId, notificationData) {
        try {
            // Create notification in database
            const notification = await Notification.createNotification(userId, notificationData, 'user');

            // Send real-time notification via socket
            if (io) {
                sendNotificationToUser(io, userId, notification);
            }

            console.log(`✅ Notification sent to user ${userId}: ${notificationData.title}`);
            return notification;
        } catch (error) {
            console.error('Error sending notification to user:', error);
            throw error;
        }
    }

    /**
     * Create and send notification to a driver
     */
    static async notifyDriver(io, driverId, notificationData) {
        try {
            // Create notification in database
            const notification = await Notification.createNotification(driverId, notificationData, 'driver');

            // Send real-time notification via socket
            if (io) {
                sendNotificationToDriver(io, driverId, notification);
            }

            console.log(`✅ Notification sent to driver ${driverId}: ${notificationData.title}`);
            return notification;
        } catch (error) {
            console.error('Error sending notification to driver:', error);
            throw error;
        }
    }

    /**
     * Notify user about ride status (User-facing)
     */
    static async notifyRideStatus(io, userId, status, rideDetails) {
        const notifications = {
            accepted: {
                title: '🚗 Driver Found',
                message: `${rideDetails.driverName} is on the way!`,
                type: 'ride_accepted',
                category: 'ride',
                priority: 'high',
                actionUrl: '/booking/live-ride'
            },
            arrived: {
                title: '📍 Driver Arrived',
                message: `Please meet ${rideDetails.driverName} at pickup.`,
                type: 'info',
                category: 'ride',
                priority: 'high',
                actionUrl: '/booking/live-ride'
            },
            started: {
                title: '🏁 Ride Started',
                message: `Enjoy your ride to ${rideDetails.destinationName || 'your destination'}!`,
                type: 'ride_started',
                category: 'ride',
                priority: 'high',
                actionUrl: '/booking/live-ride'
            },
            completed: {
                title: '✅ Ride Completed',
                message: `You've arrived! Total: ₹${rideDetails.fare}`,
                type: 'ride_completed',
                category: 'ride',
                priority: 'medium',
                actionUrl: '/trips'
            },
            cancelled: {
                title: '❌ Ride Cancelled',
                message: `Driver cancelled: ${rideDetails.cancelReason || 'Reason unspecified'}`,
                type: 'ride_cancelled',
                category: 'ride',
                priority: 'high',
                actionUrl: '/booking'
            }
        };

        const notificationData = notifications[status];
        if (notificationData) {
            notificationData.metadata = rideDetails;
            return await this.notifyUser(io, userId, notificationData);
        }
    }

    /**
     * Notify driver about ride status (Driver-facing specific)
     */
    static async notifyDriverRideStatus(io, driverId, status, rideDetails) {
        const notifications = {
            cancelled: {
                title: '⚠️ Ride Cancelled',
                message: 'User cancelled the request.',
                type: 'ride_cancelled',
                category: 'ride',
                priority: 'high',
                actionUrl: '/driver/tabs/dashboard'
            }
        };

        const notificationData = notifications[status];
        if (notificationData) {
            notificationData.metadata = rideDetails;
            // Override message if custom reason provided, but user pattern implies fixed message
            if (rideDetails.cancelReason) {
                // notificationData.message = rideDetails.cancelReason; // Keep user preferred fixed message?
                // User asked for: "User cancelled the request."
            }
            return await this.notifyDriver(io, driverId, notificationData);
        }
    }

    /**
     * Notify driver about ride request
     */
    static async notifyDriverRideRequest(io, driverId, rideDetails) {
        const pickup = rideDetails.pickupAddress || rideDetails.pickup?.name || 'Pickup';
        const dropoff = rideDetails.destinationAddress || rideDetails.destination?.name || 'Dropoff';
        const fare = rideDetails.estimatedFare || rideDetails.fare?.total || '0';

        const notificationData = {
            title: '🔔 New Ride Request',
            message: `${pickup} to ${dropoff} (₹${fare})`,
            type: 'ride_request',
            category: 'ride',
            priority: 'urgent',
            actionUrl: `/driver/trip-request?bookingId=${rideDetails.bookingId}`,
            metadata: rideDetails
        };

        return await this.notifyDriver(io, driverId, notificationData);
    }

    /**
     * Notify about payment
     */
    static async notifyPayment(io, recipientId, recipientType, paymentDetails) {
        let notificationData = {
            title: paymentDetails.success ? '💰 Payment Received' : '⏳ Payment Pending',
            message: `Amount: ₹${paymentDetails.amount}`,
            type: paymentDetails.success ? 'payment_received' : 'payment_pending',
            category: 'payment',
            priority: 'medium',
            metadata: paymentDetails
        };

        if (recipientType === 'driver') {
            // Driver specific override
            if (paymentDetails.success) {
                notificationData.title = '💵 Earnings Added';
                notificationData.message = `You earned ₹${paymentDetails.amount} for this trip.`;
                notificationData.actionUrl = '/driver/tabs/earnings';
            }
        } else {
            // User specific override
            if (paymentDetails.success) {
                notificationData.title = '💰 Payment Successful';
                notificationData.message = `₹${paymentDetails.amount} paid for your ride.`;
                notificationData.actionUrl = '/account/wallet';
            }
        }

        if (recipientType === 'driver') {
            return await this.notifyDriver(io, recipientId, notificationData);
        } else {
            return await this.notifyUser(io, recipientId, notificationData);
        }
    }

    /**
     * Notify about document verification
     */
    static async notifyDocumentVerification(io, driverId, verified, documentType) {
        const notificationData = {
            title: verified ? '✅ Documents Approved' : '❌ Document Rejected',
            message: verified
                ? `You are now ready to drive!`
                : `Your ${documentType} was rejected. Please upload again`,
            type: verified ? 'document_verified' : 'document_rejected',
            category: 'account',
            priority: 'high',
            actionUrl: '/driver/documents',
            metadata: { documentType, verified }
        };

        return await this.notifyDriver(io, driverId, notificationData);
    }

    /**
     * Send promotional notification
     */
    static async notifyPromotion(io, recipientId, recipientType, promotionDetails) {
        const notificationData = {
            title: '🎁 ' + promotionDetails.title,
            message: promotionDetails.message,
            type: 'promotion',
            category: 'promotion',
            priority: 'low',
            actionUrl: promotionDetails.actionUrl,
            metadata: promotionDetails
        };

        if (recipientType === 'driver') {
            return await this.notifyDriver(io, recipientId, notificationData);
        } else {
            return await this.notifyUser(io, recipientId, notificationData);
        }
    }

    /**
     * Send system notification
     */
    static async notifySystem(io, recipientId, recipientType, systemDetails) {
        // Remove prefix if title already has emoji or if we want clean titles
        // User requested "👋 Welcome..." so let's allow caller to set full title or use a default prefix if missing

        let title = systemDetails.title;
        if (!title.match(/^[\u{1F300}-\u{1F9FF}]/u)) { // Check for emoji start (rough check)
            title = '📢 ' + title;
        }

        const notificationData = {
            title: title,
            message: systemDetails.message,
            type: 'system_update',
            category: 'system',
            priority: systemDetails.priority || 'medium',
            actionUrl: systemDetails.actionUrl,
            metadata: systemDetails
        };

        if (recipientType === 'driver') {
            return await this.notifyDriver(io, recipientId, notificationData);
        } else {
            return await this.notifyUser(io, recipientId, notificationData);
        }
    }
}

module.exports = NotificationService;
