const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    // Owner
    // Owner (Driver or Company)
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: false, // Optional if it's a company wallet
        index: true
    },

    // Wallet Type
    type: {
        type: String,
        enum: ['driver', 'company'],
        default: 'driver',
        index: true
    },

    // Balance
    balance: {
        type: Number,
        default: 0,
        min: 0
    },

    // Locked balance (pending 24h hold)
    lockedBalance: {
        type: Number,
        default: 0,
        min: 0
    },

    // Available for withdrawal
    availableBalance: {
        type: Number,
        default: 0,
        min: 0
    },

    // Total lifetime earnings
    lifetimeEarnings: {
        type: Number,
        default: 0,
        min: 0
    },

    // Total withdrawn
    totalWithdrawn: {
        type: Number,
        default: 0,
        min: 0
    },

    // Currency
    currency: {
        type: String,
        default: 'INR'
    },

    // Wallet status
    status: {
        type: String,
        enum: ['active', 'frozen', 'suspended'],
        default: 'active',
        index: true
    },

    // Freeze/suspension details
    frozenReason: String,
    frozenAt: Date,
    frozenBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Last transaction
    lastTransactionAt: Date,

    // Statistics
    stats: {
        totalTransactions: {
            type: Number,
            default: 0
        },
        totalCredits: {
            type: Number,
            default: 0
        },
        totalDebits: {
            type: Number,
            default: 0
        },
        averageTransactionAmount: {
            type: Number,
            default: 0
        }
    }

}, {
    timestamps: true
});

// Virtual: Total balance (available + locked)
walletSchema.virtual('totalBalance').get(function () {
    return this.availableBalance + this.lockedBalance;
});

// Indexes
walletSchema.index({ status: 1 });
walletSchema.index({ balance: 1 });

// ⭐ CRITICAL: Unique constraint to ensure each driver has only ONE wallet
// This prevents duplicate wallet creation
walletSchema.index({ driver: 1 }, {
    unique: true,
    sparse: true, // Allows null values (for company wallet)
    partialFilterExpression: { driver: { $exists: true, $ne: null } }
});

// ⭐ CRITICAL: Ensure only ONE company wallet exists
walletSchema.index({ type: 1 }, {
    unique: true,
    partialFilterExpression: { type: 'company' }
});

// Instance method: Credit wallet
walletSchema.methods.credit = async function (amount, type = 'available') {
    if (amount <= 0) {
        throw new Error('Credit amount must be positive');
    }

    if (this.status !== 'active') {
        throw new Error('Wallet is not active');
    }

    if (type === 'locked') {
        this.lockedBalance += amount;
    } else {
        this.availableBalance += amount;
    }

    this.balance = this.availableBalance + this.lockedBalance;
    this.lifetimeEarnings += amount;
    this.lastTransactionAt = new Date();

    // Update stats
    this.stats.totalTransactions += 1;
    this.stats.totalCredits += amount;
    this.stats.averageTransactionAmount =
        (this.stats.totalCredits + this.stats.totalDebits) / this.stats.totalTransactions;

    await this.save();

    console.log(`💰 Wallet credited: ₹${amount} (${type}) - Driver: ${this.driver}`);

    return this;
};

// Instance method: Debit wallet
walletSchema.methods.debit = async function (amount, type = 'available') {
    if (amount <= 0) {
        throw new Error('Debit amount must be positive');
    }

    if (this.status !== 'active') {
        throw new Error('Wallet is not active');
    }

    const balanceToCheck = type === 'locked' ? this.lockedBalance : this.availableBalance;

    if (balanceToCheck < amount) {
        throw new Error(`Insufficient ${type} balance`);
    }

    if (type === 'locked') {
        this.lockedBalance -= amount;
    } else {
        this.availableBalance -= amount;
    }

    this.balance = this.availableBalance + this.lockedBalance;
    this.totalWithdrawn += amount;
    this.lastTransactionAt = new Date();

    // Update stats
    this.stats.totalTransactions += 1;
    this.stats.totalDebits += amount;
    this.stats.averageTransactionAmount =
        (this.stats.totalCredits + this.stats.totalDebits) / this.stats.totalTransactions;

    await this.save();

    console.log(`💸 Wallet debited: ₹${amount} (${type}) - Driver: ${this.driver}`);

    return this;
};

// Instance method: Transfer from locked to available
walletSchema.methods.unlockBalance = async function (amount) {
    if (amount <= 0) {
        throw new Error('Unlock amount must be positive');
    }

    if (this.lockedBalance < amount) {
        throw new Error('Insufficient locked balance');
    }

    this.lockedBalance -= amount;
    this.availableBalance += amount;

    await this.save();

    console.log(`🔓 Balance unlocked: ₹${amount} - Driver: ${this.driver}`);

    return this;
};

// Instance method: Freeze wallet
walletSchema.methods.freeze = async function (reason, adminId) {
    this.status = 'frozen';
    this.frozenReason = reason;
    this.frozenAt = new Date();
    this.frozenBy = adminId;

    await this.save();

    console.log(`❄️ Wallet frozen: ${this.driver} - Reason: ${reason}`);

    return this;
};

// Instance method: Unfreeze wallet
walletSchema.methods.unfreeze = async function () {
    this.status = 'active';
    this.frozenReason = undefined;
    this.frozenAt = undefined;
    this.frozenBy = undefined;

    await this.save();

    console.log(`✅ Wallet unfrozen: ${this.driver}`);

    return this;
};

// Static method: Get or create COMPANY wallet
walletSchema.statics.getOrCreateCompanyWallet = async function () {
    let wallet = await this.findOne({ type: 'company' });

    if (!wallet) {
        wallet = await this.create({ type: 'company' });
        console.log(`🆕 Company Wallet created`);
    }

    return wallet;
};

// Static method: Get or create wallet (Driver)
walletSchema.statics.getOrCreate = async function (driverId) {
    let wallet = await this.findOne({ driver: driverId });

    if (!wallet) {
        wallet = await this.create({ driver: driverId });
        console.log(`🆕 Wallet created for driver: ${driverId}`);
    }

    return wallet;
};

// Static method: Get wallet with driver details
walletSchema.statics.getWalletWithDriver = async function (driverId) {
    return await this.findOne({ driver: driverId }).populate('driver', 'name email phone');
};

module.exports = mongoose.model('Wallet', walletSchema);
