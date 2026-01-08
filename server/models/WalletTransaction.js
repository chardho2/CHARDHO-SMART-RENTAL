const mongoose = require('mongoose');

/**
 * WALLET TRANSACTION (LEDGER) MODEL
 * 
 * This is the SINGLE SOURCE OF TRUTH for all money movement.
 * Every credit/debit to any wallet MUST have a corresponding ledger entry.
 * 
 * Industry Standard: Used by Uber, Ola, Swiggy, etc.
 */

const walletTransactionSchema = new mongoose.Schema({
    // ========================================
    // WALLET REFERENCE
    // ========================================
    walletId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Wallet',
        required: true,
        index: true
    },

    // Owner references (for quick queries)
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        index: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },

    // ========================================
    // TRANSACTION TYPE
    // ========================================
    type: {
        type: String,
        enum: ['CREDIT', 'DEBIT'],
        required: true,
        index: true
    },

    // ========================================
    // AMOUNT
    // ========================================
    amount: {
        type: Number,
        required: true,
        min: 0
    },

    // Balance snapshot (for audit trail)
    balanceBefore: {
        type: Number,
        required: true
    },

    balanceAfter: {
        type: Number,
        required: true
    },

    // ========================================
    // SOURCE / PURPOSE
    // ========================================
    source: {
        type: String,
        enum: [
            // CREDITS
            'RIDE_PAYMENT',           // Driver earning from completed ride
            'COMMISSION',             // Company commission from ride
            'BONUS',                  // Promotional bonus
            'REFERRAL',               // Referral bonus
            'REFUND',                 // Refund to user/driver
            'ADJUSTMENT',             // Manual adjustment by admin
            'CASH_SETTLEMENT',        // Driver settling cash dues

            // DEBITS
            'PAYOUT',                 // Driver withdrawal to bank
            'COMMISSION_DEDUCTION',   // Commission deducted from driver (cash rides)
            'PENALTY',                // Penalty/fine
            'CANCELLATION_FEE',       // Cancellation charge
            'CASH_COLLECTION'         // Cash collected by driver (owed to company)
        ],
        required: true,
        index: true
    },

    // ========================================
    // DESCRIPTION
    // ========================================
    description: {
        type: String,
        required: true,
        maxlength: 500
    },

    // ========================================
    // STATUS
    // ========================================
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED', 'REVERSED'],
        default: 'COMPLETED',
        index: true
    },

    // ========================================
    // REFERENCE IDs (for traceability)
    // ========================================
    referenceId: {
        type: String,
        index: true
    },

    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        index: true
    },

    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },

    // For payouts
    payoutId: {
        type: String,
        index: true
    },

    // External gateway transaction ID (PhonePe, Razorpay, etc.)
    gatewayTransactionId: {
        type: String,
        index: true
    },

    // ========================================
    // METADATA
    // ========================================
    metadata: {
        // Payment method
        paymentMethod: {
            type: String,
            enum: ['CASH', 'UPI', 'CARD', 'WALLET', 'BANK_TRANSFER', 'PHONEPE', 'RAZORPAY']
        },

        // For ride payments
        rideDetails: {
            fare: Number,
            commission: Number,
            driverEarning: Number,
            distance: Number
        },

        // For payouts
        payoutDetails: {
            bankAccount: String,
            ifscCode: String,
            accountHolderName: String,
            utrNumber: String,
            tax: Number,
            processingFee: Number
        },

        // For cash rides
        cashDetails: {
            collectedAmount: Number,
            commissionOwed: Number,
            settlementDate: Date
        },

        // Admin actions
        adminDetails: {
            adminId: mongoose.Schema.Types.ObjectId,
            reason: String,
            approvedAt: Date
        },

        // Additional flexible metadata
        extra: mongoose.Schema.Types.Mixed
    },

    // ========================================
    // TIMESTAMPS
    // ========================================
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },

    processedAt: {
        type: Date
    },

    // ========================================
    // RECONCILIATION
    // ========================================
    reconciled: {
        type: Boolean,
        default: false,
        index: true
    },

    reconciledAt: {
        type: Date
    },

    reconciledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, {
    timestamps: true
});

// ========================================
// INDEXES (for performance)
// ========================================
walletTransactionSchema.index({ walletId: 1, createdAt: -1 });
walletTransactionSchema.index({ driver: 1, createdAt: -1 });
walletTransactionSchema.index({ user: 1, createdAt: -1 });
walletTransactionSchema.index({ type: 1, status: 1 });
walletTransactionSchema.index({ source: 1, createdAt: -1 });
walletTransactionSchema.index({ bookingId: 1 });
walletTransactionSchema.index({ gatewayTransactionId: 1 });
walletTransactionSchema.index({ reconciled: 1, createdAt: -1 });

// Compound index for financial reports
walletTransactionSchema.index({
    walletId: 1,
    type: 1,
    status: 1,
    createdAt: -1
});

// ========================================
// STATIC METHODS
// ========================================

/**
 * Create a ledger entry (CREDIT)
 */
walletTransactionSchema.statics.createCredit = async function (data) {
    const {
        walletId,
        driver,
        user,
        amount,
        source,
        description,
        referenceId,
        bookingId,
        paymentId,
        metadata = {}
    } = data;

    // Get current wallet balance
    const Wallet = mongoose.model('Wallet');
    const wallet = await Wallet.findById(walletId);

    if (!wallet) {
        throw new Error('Wallet not found');
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore + amount;

    const transaction = await this.create({
        walletId,
        driver,
        user,
        type: 'CREDIT',
        amount,
        balanceBefore,
        balanceAfter,
        source,
        description,
        referenceId,
        bookingId,
        paymentId,
        status: 'COMPLETED',
        metadata,
        processedAt: new Date()
    });

    console.log(`✅ LEDGER CREDIT: ₹${amount} | Wallet: ${walletId} | Source: ${source}`);

    return transaction;
};

/**
 * Create a ledger entry (DEBIT)
 */
walletTransactionSchema.statics.createDebit = async function (data) {
    const {
        walletId,
        driver,
        user,
        amount,
        source,
        description,
        referenceId,
        bookingId,
        payoutId,
        metadata = {}
    } = data;

    // Get current wallet balance
    const Wallet = mongoose.model('Wallet');
    const wallet = await Wallet.findById(walletId);

    if (!wallet) {
        throw new Error('Wallet not found');
    }

    const balanceBefore = wallet.balance;
    const balanceAfter = balanceBefore - amount;

    if (balanceAfter < 0) {
        throw new Error('Insufficient wallet balance');
    }

    const transaction = await this.create({
        walletId,
        driver,
        user,
        type: 'DEBIT',
        amount,
        balanceBefore,
        balanceAfter,
        source,
        description,
        referenceId,
        bookingId,
        payoutId,
        status: 'COMPLETED',
        metadata,
        processedAt: new Date()
    });

    console.log(`✅ LEDGER DEBIT: ₹${amount} | Wallet: ${walletId} | Source: ${source}`);

    return transaction;
};

/**
 * Get transaction history for a wallet
 */
walletTransactionSchema.statics.getHistory = async function (walletId, options = {}) {
    const {
        page = 1,
        limit = 50,
        type = null,
        source = null,
        startDate = null,
        endDate = null
    } = options;

    const query = { walletId };

    if (type) query.type = type;
    if (source) query.source = source;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await this.countDocuments(query);
    const transactions = await this.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('driver', 'name phone')
        .populate('user', 'name phone')
        .lean();

    return {
        transactions,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

/**
 * Get balance summary from ledger (for reconciliation)
 */
walletTransactionSchema.statics.getBalanceSummary = async function (walletId) {
    const result = await this.aggregate([
        { $match: { walletId: mongoose.Types.ObjectId(walletId), status: 'COMPLETED' } },
        {
            $group: {
                _id: '$type',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);

    const summary = {
        totalCredits: 0,
        totalDebits: 0,
        creditCount: 0,
        debitCount: 0,
        calculatedBalance: 0
    };

    result.forEach(item => {
        if (item._id === 'CREDIT') {
            summary.totalCredits = item.total;
            summary.creditCount = item.count;
        } else if (item._id === 'DEBIT') {
            summary.totalDebits = item.total;
            summary.debitCount = item.count;
        }
    });

    summary.calculatedBalance = summary.totalCredits - summary.totalDebits;

    return summary;
};

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
