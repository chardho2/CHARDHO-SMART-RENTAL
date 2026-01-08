const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        default: null
    },
    pickup: {
        name: { type: String, required: true },
        address: { type: String, required: true },
        coordinates: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true }
        }
    },
    destination: {
        name: { type: String, required: true },
        address: { type: String, required: true },
        coordinates: {
            latitude: { type: Number, required: true },
            longitude: { type: Number, required: true }
        }
    },
    rideType: {
        id: { type: String, required: true },
        name: { type: String, required: true },
        icon: { type: String, required: true },
        basePrice: { type: Number, required: true }
    },
    fare: {
        baseFare: { type: Number, required: true },
        distanceCharge: { type: Number, required: true },
        total: { type: Number, required: true },
        distance: { type: Number, required: true } // in km
    },

    // Financial Breakdown
    commission: { type: Number, default: 0 }, // Platform fee
    driverEarnings: { type: Number, default: 0 }, // Net earnings
    payoutStatus: {
        type: String,
        enum: ['pending', 'hold', 'eligible', 'processed'],
        default: 'pending'
    },
    payoutEligibleAt: { type: Date, default: null }, // T+24h timestamp

    status: {
        type: String,
        enum: ['pending', 'accepted', 'driver_arrived', 'in_progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    estimatedTime: { type: Number }, // in minutes
    actualTime: { type: Number }, // in minutes
    payment: {
        method: { type: String, enum: ['cash', 'upi', 'card'], default: 'cash' },
        status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
        transactionId: { type: String, default: null },
        paidAt: { type: Date, default: null }
    },
    // User rating of driver
    rating: { type: Number, min: 1, max: 5, default: null },
    feedback: { type: String, default: null },
    ratedAt: { type: Date, default: null },
    // Legacy rating structure (kept for backwards compatibility)
    ratingLegacy: {
        userRating: { type: Number, min: 1, max: 5, default: null },
        driverRating: { type: Number, min: 1, max: 5, default: null },
        userComment: { type: String, default: null },
        driverComment: { type: String, default: null }
    },
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Could be User or Driver, but User is more common for cancellation
        default: null
    },
    cancellationReason: { type: String, default: null },
    verificationPin: { type: String, default: null }, // 4-digit PIN for ride start
    otpAttempts: { type: Number, default: 0 } // Rate limiting check
}, {
    timestamps: true
});

// Indexes for faster queries
// Compound indexes for common query patterns
bookingSchema.index({ user: 1, status: 1, createdAt: -1 }); // User's bookings by status
bookingSchema.index({ driver: 1, status: 1, createdAt: -1 }); // Driver's bookings by status
bookingSchema.index({ status: 1, createdAt: -1 }); // All bookings by status

// Geospatial indexes for location-based queries
bookingSchema.index({ 'pickup.coordinates.latitude': 1, 'pickup.coordinates.longitude': 1 });
bookingSchema.index({ 'destination.coordinates.latitude': 1, 'destination.coordinates.longitude': 1 });

// Index for rating queries (stats calculations)
bookingSchema.index({ driver: 1, rating: 1 }); // Driver ratings
bookingSchema.index({ rating: 1, createdAt: -1 }); // Recent ratings

// Index for payment queries
bookingSchema.index({ 'payment.status': 1, createdAt: -1 });

// Index for verification PIN lookups
bookingSchema.index({ verificationPin: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
