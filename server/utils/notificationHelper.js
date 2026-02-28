const Notification = require('../models/Notification');

/**
 * Notification Helper Utility
 * Centralized notification creation for different events
 */

class NotificationHelper {
    constructor(io) {
        this.io = io;
    }

    /**
     * Send notification to user
     */
    async sendNotification(userId, data) {
        try {
            const notification = await Notification.createNotification(userId, data);

            // Emit real-time notification via socket
            if (this.io) {
                this.io.to(userId.toString()).emit('new_notification', {
                    ...notification.toObject(),
                    timestamp: new Date()
                });
            }

            return notification;
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    }

    /**
     * Ride Request Notification (for drivers)
     */
    async notifyRideRequest(driverId, rideData) {
        return await this.sendNotification(driverId, {
            title: 'New Ride Request',
            message: `New ride request from ${rideData.pickupLocation} to ${rideData.dropoffLocation}`,
            type: 'ride_request',
            category: 'ride',
            priority: 'high',
            actionUrl: `/driver/trip-request/${rideData.rideId}`,
            metadata: {
                rideId: rideData.rideId,
                fare: rideData.fare,
                distance: rideData.distance
            },
            expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
        });
    }

    /**
     * Ride Accepted Notification (for users)
     */
    async notifyRideAccepted(userId, rideData) {
        return await this.sendNotification(userId, {
            title: 'Ride Accepted',
            message: `${rideData.driverName} has accepted your ride request`,
            type: 'ride_accepted',
            category: 'ride',
            priority: 'high',
            actionUrl: `/booking/live-ride/${rideData.rideId}`,
            metadata: {
                rideId: rideData.rideId,
                driverName: rideData.driverName,
                vehicleNumber: rideData.vehicleNumber
            }
        });
    }

    /**
     * Ride Started Notification
     */
    async notifyRideStarted(userId, rideData) {
        return await this.sendNotification(userId, {
            title: 'Ride Started',
            message: 'Your ride has started. Enjoy your journey!',
            type: 'ride_started',
            category: 'ride',
            priority: 'medium',
            actionUrl: `/booking/live-ride/${rideData.rideId}`,
            metadata: {
                rideId: rideData.rideId,
                startTime: new Date()
            }
        });
    }

    /**
     * Ride Completed Notification
     */
    async notifyRideCompleted(userId, rideData) {
        return await this.sendNotification(userId, {
            title: 'Ride Completed',
            message: `Your ride has been completed. Total fare: ₹${rideData.fare}`,
            type: 'ride_completed',
            category: 'ride',
            priority: 'medium',
            actionUrl: `/booking/ride-history`,
            metadata: {
                rideId: rideData.rideId,
                fare: rideData.fare,
                duration: rideData.duration,
                distance: rideData.distance
            }
        });
    }

    /**
     * Ride Cancelled Notification
     */
    async notifyRideCancelled(userId, rideData) {
        return await this.sendNotification(userId, {
            title: 'Ride Cancelled',
            message: rideData.reason || 'Your ride has been cancelled',
            type: 'ride_cancelled',
            category: 'ride',
            priority: 'high',
            metadata: {
                rideId: rideData.rideId,
                cancelledBy: rideData.cancelledBy,
                reason: rideData.reason
            }
        });
    }

    /**
     * Payment Received Notification (for drivers)
     */
    async notifyPaymentReceived(driverId, paymentData) {
        return await this.sendNotification(driverId, {
            title: 'Payment Received',
            message: `You received ₹${paymentData.amount} for ride #${paymentData.rideId}`,
            type: 'payment_received',
            category: 'payment',
            priority: 'medium',
            actionUrl: '/driver/tabs/earnings',
            metadata: {
                rideId: paymentData.rideId,
                amount: paymentData.amount,
                paymentMethod: paymentData.paymentMethod
            }
        });
    }

    /**
     * Payment Pending Notification
     */
    async notifyPaymentPending(userId, paymentData) {
        return await this.sendNotification(userId, {
            title: 'Payment Pending',
            message: `Payment of ₹${paymentData.amount} is pending for your ride`,
            type: 'payment_pending',
            category: 'payment',
            priority: 'high',
            actionUrl: '/account/wallet',
            metadata: {
                rideId: paymentData.rideId,
                amount: paymentData.amount
            }
        });
    }

    /**
     * Document Verified Notification (for drivers)
     */
    async notifyDocumentVerified(driverId, documentData) {
        return await this.sendNotification(driverId, {
            title: 'Document Verified',
            message: `Your ${documentData.documentType} has been verified successfully`,
            type: 'document_verified',
            category: 'account',
            priority: 'medium',
            actionUrl: '/driver/documents',
            metadata: {
                documentType: documentData.documentType,
                verifiedAt: new Date()
            }
        });
    }

    /**
     * Document Rejected Notification (for drivers)
     */
    async notifyDocumentRejected(driverId, documentData) {
        return await this.sendNotification(driverId, {
            title: 'Document Rejected',
            message: `Your ${documentData.documentType} was rejected. Reason: ${documentData.reason}`,
            type: 'document_rejected',
            category: 'account',
            priority: 'high',
            actionUrl: '/driver/documents',
            metadata: {
                documentType: documentData.documentType,
                reason: documentData.reason
            }
        });
    }

    /**
     * Profile Update Notification
     */
    async notifyProfileUpdate(userId, updateData) {
        return await this.sendNotification(userId, {
            title: 'Profile Updated',
            message: 'Your profile has been updated successfully',
            type: 'profile_update',
            category: 'account',
            priority: 'low',
            metadata: {
                updatedFields: updateData.fields
            }
        });
    }

    /**
     * System Update Notification
     */
    async notifySystemUpdate(userId, updateData) {
        return await this.sendNotification(userId, {
            title: updateData.title || 'System Update',
            message: updateData.message,
            type: 'system_update',
            category: 'system',
            priority: updateData.priority || 'medium',
            actionUrl: updateData.actionUrl,
            metadata: updateData.metadata || {}
        });
    }

    /**
     * Promotion Notification
     */
    async notifyPromotion(userId, promotionData) {
        return await this.sendNotification(userId, {
            title: promotionData.title,
            message: promotionData.message,
            type: 'promotion',
            category: 'promotion',
            priority: 'low',
            actionUrl: promotionData.actionUrl,
            metadata: {
                promoCode: promotionData.promoCode,
                discount: promotionData.discount,
                validUntil: promotionData.validUntil
            },
            expiresAt: promotionData.validUntil
        });
    }

    /**
     * Missed Ride Notification (for drivers)
     */
    async notifyMissedRide(driverId, rideData) {
        return await this.sendNotification(driverId, {
            title: 'Missed Ride',
            message: 'You missed a ride request. Make sure to stay online and accept rides quickly.',
            type: 'missed_ride',
            category: 'ride',
            priority: 'medium',
            metadata: {
                rideId: rideData.rideId,
                missedAt: new Date()
            }
        });
    }

    /**
     * Bulk notification to multiple users
     */
    async sendBulkNotifications(userIds, data) {
        try {
            const notifications = await Promise.all(
                userIds.map(userId => this.sendNotification(userId, data))
            );
            return notifications;
        } catch (error) {
            console.error('Error sending bulk notifications:', error);
            throw error;
        }
    }
}

module.exports = NotificationHelper;
