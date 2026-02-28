const mongoose = require('mongoose');

const fraudAlertSchema = new mongoose.Schema({
    // Related entities
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        index: true
    },

    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: true,
        index: true
    },

    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },

    // Alert details
    alertType: {
        type: String,
        enum: [
            'duplicate_payment',
            'amount_mismatch',
            'high_fraud_score',
            'suspicious_pattern',
            'velocity_exceeded',
            'geolocation_anomaly',
            'gateway_failure',
            'manual_flag'
        ],
        required: true
    },

    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        required: true,
        default: 'medium',
        index: true
    },

    reason: {
        type: String,
        required: true
    },

    // Additional context
    metadata: {
        fraudScore: Number,
        failedChecks: [String],
        suspiciousData: mongoose.Schema.Types.Mixed,
        relatedAlerts: [mongoose.Schema.Types.ObjectId]
    },

    // Resolution
    resolved: {
        type: Boolean,
        default: false,
        index: true
    },

    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    resolvedAt: Date,

    resolution: {
        action: {
            type: String,
            enum: ['approved', 'rejected', 'refunded', 'escalated', 'dismissed']
        },
        notes: String,
        evidence: [String]
    },

    // Notifications
    notificationsSent: [{
        recipient: String,
        type: String,
        sentAt: Date
    }],

    // Auto-resolution
    autoResolved: {
        type: Boolean,
        default: false
    },

    autoResolvedReason: String

}, {
    timestamps: true
});

// Indexes
fraudAlertSchema.index({ createdAt: -1 });
fraudAlertSchema.index({ driver: 1, resolved: 1 });
fraudAlertSchema.index({ severity: 1, resolved: 1 });

// Static method: Create alert
fraudAlertSchema.statics.createAlert = async function (bookingId, driverId, alertType, severity, reason, metadata = {}) {
    const alert = await this.create({
        booking: bookingId,
        driver: driverId,
        alertType,
        severity,
        reason,
        metadata
    });

    console.log(`🚨 Fraud Alert Created: ${alertType} (${severity}) - ${reason}`);

    // TODO: Send notifications to admin/security team

    return alert;
};

// Instance method: Resolve alert
fraudAlertSchema.methods.resolve = async function (action, adminId, notes = '', evidence = []) {
    this.resolved = true;
    this.resolvedBy = adminId;
    this.resolvedAt = new Date();
    this.resolution = {
        action,
        notes,
        evidence
    };

    await this.save();

    console.log(`✅ Fraud Alert Resolved: ${this._id} - Action: ${action}`);

    return this;
};

// Instance method: Auto-resolve (for low-severity alerts)
fraudAlertSchema.methods.autoResolve = async function (reason) {
    this.resolved = true;
    this.autoResolved = true;
    this.autoResolvedReason = reason;
    this.resolvedAt = new Date();

    await this.save();

    console.log(`🤖 Fraud Alert Auto-Resolved: ${this._id} - ${reason}`);

    return this;
};

// Static method: Get unresolved alerts
fraudAlertSchema.statics.getUnresolvedAlerts = async function (severity = null) {
    const query = { resolved: false };
    if (severity) query.severity = severity;

    return await this.find(query)
        .populate('booking')
        .populate('driver')
        .populate('payment')
        .sort({ severity: -1, createdAt: -1 });
};

// Static method: Get driver alert history
fraudAlertSchema.statics.getDriverAlerts = async function (driverId, limit = 10) {
    return await this.find({ driver: driverId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('booking');
};

module.exports = mongoose.model('FraudAlert', fraudAlertSchema);
