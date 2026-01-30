const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    // Unique payment identifier
    paymentId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Related booking
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true,
        index: true
    },

    // Payment details
    amount: {
        type: Number,
        required: true,
        min: 0
    },

    currency: {
        type: String,
        default: 'INR'
    },

    // Payment method
    method: {
        type: String,
        enum: ['qr', 'cash', 'wallet', 'card', 'upi'],
        required: true
    },

    // Gateway information (for digital payments)
    gatewayTransactionId: {
        type: String,
        index: true
    },

    gatewayName: {
        type: String,
        enum: ['razorpay', 'paytm', 'googlepay', 'none'],

        default: 'none'
    },

    // Payment status
    status: {
        type: String,
        enum: ['pending', 'verified', 'failed', 'disputed', 'refunded'],
        default: 'pending',
        index: true
    },

    verifiedAt: {
        type: Date
    },

    // Metadata for validation
    metadata: {
        qrCodeId: String,
        deviceInfo: {
            platform: String,
            version: String,
            deviceId: String
        },
        location: {
            latitude: Number,
            longitude: Number,
            accuracy: Number
        },
        ipAddress: String,
        userAgent: String
    },

    // Validation checks performed
    validationChecks: [{
        type: {
            type: String,
            enum: [
                'uniqueness',
                'amount_match',
                'gateway_verification',
                'geolocation',
                'fraud_score',
                'duplicate_check',
                'pattern_analysis'
            ]
        },
        passed: Boolean,
        details: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],

    // Fraud detection
    fraudScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },

    flagged: {
        type: Boolean,
        default: false,
        index: true
    },

    flagReason: String,

    // Admin review
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    reviewedAt: Date,

    reviewNotes: String

}, {
    timestamps: true
});

// Indexes for performance
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ booking: 1, status: 1 });
paymentSchema.index({ gatewayTransactionId: 1 }, { sparse: true });

// Static method: Generate unique payment ID
paymentSchema.statics.generatePaymentId = function () {
    const crypto = require('crypto');
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const hash = crypto.createHash('sha256')
        .update(`${timestamp}${random}`)
        .digest('hex')
        .substring(0, 8);

    return `PAY_${timestamp}_${hash}`.toUpperCase();
};

// Instance method: Add validation check
paymentSchema.methods.addValidationCheck = function (type, passed, details = '') {
    this.validationChecks.push({
        type,
        passed,
        details,
        timestamp: new Date()
    });

    // If any check fails, flag the payment
    if (!passed) {
        this.flagged = true;
        if (!this.flagReason) {
            this.flagReason = `Failed ${type} check`;
        }
    }
};

// Instance method: Mark as verified
paymentSchema.methods.markAsVerified = function () {
    this.status = 'verified';
    this.verifiedAt = new Date();
    this.flagged = false;
};

// Instance method: Calculate fraud score
paymentSchema.methods.calculateFraudScore = function () {
    let score = 0;

    // Check validation results
    const failedChecks = this.validationChecks.filter(c => !c.passed).length;
    score += failedChecks * 20; // Each failed check adds 20 points

    // High amount increases risk
    if (this.amount > 5000) score += 10;
    if (this.amount > 10000) score += 20;

    // Cash payments are riskier
    if (this.method === 'cash') score += 15;

    // Missing gateway verification
    if (this.method !== 'cash' && !this.gatewayTransactionId) score += 30;

    this.fraudScore = Math.min(score, 100);

    // Flag if score is high
    if (this.fraudScore >= 50) {
        this.flagged = true;
        this.flagReason = `High fraud score: ${this.fraudScore}`;
    }

    return this.fraudScore;
};

module.exports = mongoose.model('Payment', paymentSchema);
