const mongoose = require('mongoose');

/**
 * DRIVER WALLET MODEL (Simplified)
 * 
 * This is a simplified wallet model with clean field names.
 * Maps to the existing Wallet collection for backward compatibility.
 */

const driverWalletSchema = new mongoose.Schema({
    // Driver ID (renamed from 'driver' for clarity)
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        required: true,
        unique: true,
        index: true
    },

    // Total balance
    balance: {
        type: Number,
        default: 0,
        min: 0
    },

    // Withdrawable balance (available for withdrawal)
    withdrawableBalance: {
        type: Number,
        default: 0,
        min: 0
    },

    // Optional: Locked balance (for 24h holds, etc.)
    lockedBalance: {
        type: Number,
        default: 0,
        min: 0
    },

    // Optional: Lifetime statistics
    lifetimeEarnings: {
        type: Number,
        default: 0,
        min: 0
    },

    totalWithdrawn: {
        type: Number,
        default: 0,
        min: 0
    },

    // Wallet status
    status: {
        type: String,
        enum: ['active', 'frozen', 'suspended'],
        default: 'active',
        index: true
    },

    // Currency
    currency: {
        type: String,
        default: 'INR'
    }

}, {
    timestamps: true, // Adds createdAt and updatedAt automatically
    collection: 'wallets' // Use same collection as existing Wallet model
});

// ⭐ CRITICAL: Unique constraint
driverWalletSchema.index({ driverId: 1 }, { unique: true });

// Virtual: Alias for backward compatibility
driverWalletSchema.virtual('driver').get(function () {
    return this.driverId;
});

driverWalletSchema.virtual('availableBalance').get(function () {
    return this.withdrawableBalance;
});

// Ensure virtuals are included in JSON
driverWalletSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        // Clean up response
        ret.id = ret._id;
        delete ret.__v;
        return ret;
    }
});

driverWalletSchema.set('toObject', { virtuals: true });

// Instance Methods

/**
 * Credit wallet
 */
driverWalletSchema.methods.credit = async function (amount, type = 'withdrawable') {
    if (amount <= 0) {
        throw new Error('Credit amount must be positive');
    }

    if (this.status !== 'active') {
        throw new Error('Wallet is not active');
    }

    if (type === 'withdrawable') {
        this.withdrawableBalance += amount;
    } else if (type === 'locked') {
        this.lockedBalance += amount;
    }

    this.balance = this.withdrawableBalance + this.lockedBalance;
    this.lifetimeEarnings += amount;

    await this.save();
    return this;
};

/**
 * Debit wallet
 */
driverWalletSchema.methods.debit = async function (amount, type = 'withdrawable') {
    if (amount <= 0) {
        throw new Error('Debit amount must be positive');
    }

    if (this.status !== 'active') {
        throw new Error('Wallet is not active');
    }

    const balanceToCheck = type === 'locked' ? this.lockedBalance : this.withdrawableBalance;

    if (balanceToCheck < amount) {
        throw new Error('Insufficient balance');
    }

    if (type === 'withdrawable') {
        this.withdrawableBalance -= amount;
    } else if (type === 'locked') {
        this.lockedBalance -= amount;
    }

    this.balance = this.withdrawableBalance + this.lockedBalance;

    await this.save();
    return this;
};

/**
 * Unlock balance (move from locked to withdrawable)
 */
driverWalletSchema.methods.unlockBalance = async function (amount) {
    if (amount <= 0) {
        throw new Error('Unlock amount must be positive');
    }

    if (this.lockedBalance < amount) {
        throw new Error('Insufficient locked balance');
    }

    this.lockedBalance -= amount;
    this.withdrawableBalance += amount;

    await this.save();
    return this;
};

/**
 * Freeze wallet
 */
driverWalletSchema.methods.freeze = async function (reason) {
    this.status = 'frozen';
    await this.save();
    return this;
};

/**
 * Unfreeze wallet
 */
driverWalletSchema.methods.unfreeze = async function () {
    this.status = 'active';
    await this.save();
    return this;
};

// Static Methods

/**
 * Get or create driver wallet
 */
driverWalletSchema.statics.getOrCreate = async function (driverId) {
    let wallet = await this.findOne({ driverId });

    if (!wallet) {
        wallet = await this.create({
            driverId,
            balance: 0,
            withdrawableBalance: 0,
            lockedBalance: 0,
            status: 'active'
        });
        console.log(`✅ Created new wallet for driver: ${driverId}`);
    }

    return wallet;
};

/**
 * Get wallet by driver ID
 */
driverWalletSchema.statics.getByDriverId = async function (driverId) {
    return await this.findOne({ driverId });
};

/**
 * Get balance
 */
driverWalletSchema.statics.getBalance = async function (driverId) {
    const wallet = await this.findOne({ driverId });

    if (!wallet) {
        return {
            balance: 0,
            withdrawableBalance: 0,
            lockedBalance: 0
        };
    }

    return {
        balance: wallet.balance,
        withdrawableBalance: wallet.withdrawableBalance,
        lockedBalance: wallet.lockedBalance,
        lifetimeEarnings: wallet.lifetimeEarnings,
        totalWithdrawn: wallet.totalWithdrawn,
        currency: wallet.currency,
        status: wallet.status
    };
};

const DriverWallet = mongoose.model('DriverWallet', driverWalletSchema);

module.exports = DriverWallet;
