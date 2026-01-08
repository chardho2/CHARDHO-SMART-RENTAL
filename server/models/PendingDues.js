const mongoose = require('mongoose');

/**
 * PENDING DUES MODEL
 * 
 * Tracks money owed by drivers to the company
 * Primarily for cash rides where driver doesn't have sufficient balance
 */

const pendingDuesSchema = new mongoose.Schema({
    // Driver who owes money
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: true,
        index: true
    },

    // Amount owed
    amount: {
        type: Number,
        required: true,
        min: 0
    },

    // Original amount (before partial settlements)
    originalAmount: {
        type: Number,
        required: true
    },

    // Reason for dues
    reason: {
        type: String,
        enum: [
            'CASH_COMMISSION',      // Commission from cash ride
            'PENALTY',              // Penalty/fine
            'CANCELLATION_FEE',     // Cancellation charge
            'DAMAGE_FEE',           // Vehicle damage
            'OTHER'
        ],
        required: true
    },

    // Description
    description: {
        type: String,
        required: true
    },

    // Status
    status: {
        type: String,
        enum: ['PENDING', 'PARTIALLY_SETTLED', 'SETTLED', 'WAIVED'],
        default: 'PENDING',
        index: true
    },

    // Reference
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        index: true
    },

    // Settlement tracking
    settlements: [{
        amount: Number,
        settledAt: Date,
        method: {
            type: String,
            enum: ['AUTO_DEDUCTION', 'MANUAL_PAYMENT', 'ADMIN_WAIVER']
        },
        transactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'WalletTransaction'
        },
        notes: String
    }],

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },

    settledAt: Date,

    // Due date (optional)
    dueDate: Date,

    // Admin actions
    waivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    waivedReason: String,

    // Priority
    priority: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
        default: 'MEDIUM'
    },

    // Reminder tracking
    remindersSent: {
        type: Number,
        default: 0
    },

    lastReminderAt: Date

}, {
    timestamps: true
});

// Indexes
pendingDuesSchema.index({ driver: 1, status: 1 });
pendingDuesSchema.index({ status: 1, createdAt: -1 });
pendingDuesSchema.index({ dueDate: 1, status: 1 });

// Virtual: Amount settled
pendingDuesSchema.virtual('amountSettled').get(function () {
    return this.settlements.reduce((sum, s) => sum + s.amount, 0);
});

// Virtual: Is overdue
pendingDuesSchema.virtual('isOverdue').get(function () {
    if (!this.dueDate) return false;
    return this.status === 'PENDING' && new Date() > this.dueDate;
});

// Instance method: Add settlement
pendingDuesSchema.methods.addSettlement = async function (amount, method, transactionId, notes) {
    if (amount <= 0) {
        throw new Error('Settlement amount must be positive');
    }

    if (amount > this.amount) {
        throw new Error('Settlement amount exceeds pending dues');
    }

    this.settlements.push({
        amount,
        settledAt: new Date(),
        method,
        transactionId,
        notes
    });

    this.amount -= amount;

    if (this.amount === 0) {
        this.status = 'SETTLED';
        this.settledAt = new Date();
    } else {
        this.status = 'PARTIALLY_SETTLED';
    }

    await this.save();

    console.log(`✅ Settlement recorded: ₹${amount} | Remaining: ₹${this.amount}`);

    return this;
};

// Instance method: Waive dues
pendingDuesSchema.methods.waive = async function (adminId, reason) {
    this.status = 'WAIVED';
    this.waivedBy = adminId;
    this.waivedReason = reason;
    this.settledAt = new Date();

    await this.save();

    console.log(`✅ Dues waived: ₹${this.amount} | Reason: ${reason}`);

    return this;
};

// Static method: Get total pending dues for driver
pendingDuesSchema.statics.getTotalDues = async function (driverId) {
    const result = await this.aggregate([
        {
            $match: {
                driver: mongoose.Types.ObjectId(driverId),
                status: { $in: ['PENDING', 'PARTIALLY_SETTLED'] }
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);

    return result.length > 0
        ? { totalAmount: result[0].totalAmount, count: result[0].count }
        : { totalAmount: 0, count: 0 };
};

// Static method: Get overdue dues
pendingDuesSchema.statics.getOverdueDues = async function () {
    return await this.find({
        status: { $in: ['PENDING', 'PARTIALLY_SETTLED'] },
        dueDate: { $lt: new Date() }
    }).populate('driver', 'name phone email');
};

module.exports = mongoose.model('PendingDues', pendingDuesSchema);
