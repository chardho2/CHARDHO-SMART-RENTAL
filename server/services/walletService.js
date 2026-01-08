const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Payment = require('../models/Payment');

/**
 * WALLET SERVICE
 * Handles all wallet operations for drivers
 */

/**
 * Get or create wallet for driver
 * @param {String} driverId - Driver ID
 * @returns {Object} - Wallet document
 */
const getWallet = async (driverId) => {
    return await Wallet.getOrCreate(driverId);
};

/**
 * Get wallet balance details
 * @param {String} driverId - Driver ID
 * @returns {Object} - Balance breakdown
 */
const getBalance = async (driverId) => {
    const wallet = await Wallet.getOrCreate(driverId);

    return {
        totalBalance: wallet.balance,
        availableBalance: wallet.availableBalance,
        lockedBalance: wallet.lockedBalance,
        lifetimeEarnings: wallet.lifetimeEarnings,
        totalWithdrawn: wallet.totalWithdrawn,
        currency: wallet.currency,
        status: wallet.status
    };
};

/**
 * Credit wallet (add money)
 * @param {String} driverId - Driver ID
 * @param {Number} amount - Amount to credit
 * @param {String} type - 'available' or 'locked'
 * @param {String} source - Source of credit (e.g., 'ride_earning', 'bonus', 'refund')
 * @param {String} description - Transaction description
 * @param {Object} metadata - Additional metadata
 * @param {String} userId - Optional User ID (Passenger)
 * @returns {Object} - Updated wallet and transaction
 */
const creditWallet = async (driverId, amount, type = 'available', source, description, metadata = {}, userId = null) => {
    const wallet = await Wallet.getOrCreate(driverId);

    // Credit the wallet
    await wallet.credit(amount, type);

    // Create transaction record
    const transactionData = {
        driver: driverId,
        type: 'credit',
        amount,
        description,
        status: type === 'locked' ? 'pending' : 'completed',
        paymentMethod: source || 'wallet',
        metadata: {
            ...metadata,
            balanceType: type,
            previousBalance: wallet.balance - amount,
            newBalance: wallet.balance
        }
    };

    if (userId) {
        transactionData.user = userId;
    }

    const transaction = await Transaction.create(transactionData);

    return {
        wallet,
        transaction
    };
};
/**
 * Debit wallet (withdraw money)
 * @param {String} driverId - Driver ID
 * @param {Number} amount - Amount to debit
 * @param {String} type - 'available' or 'locked'
 * @param {String} purpose - Purpose of debit (e.g., 'payout', 'penalty', 'refund')
 * @param {String} description - Transaction description
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Updated wallet and transaction
 */
const debitWallet = async (driverId, amount, type = 'available', purpose, description, metadata = {}) => {
    const wallet = await Wallet.getOrCreate(driverId);

    // Debit the wallet
    await wallet.debit(amount, type);

    // Create transaction record
    const transaction = await Transaction.create({
        driver: driverId,
        type: 'debit',
        amount,
        description,
        status: 'completed',
        paymentMethod: purpose || 'wallet',
        metadata: {
            ...metadata,
            balanceType: type,
            previousBalance: wallet.balance + amount,
            newBalance: wallet.balance
        }
    });

    return {
        wallet,
        transaction
    };
};

/**
 * Unlock balance (move from locked to available)
 * @param {String} driverId - Driver ID
 * @param {Number} amount - Amount to unlock
 * @param {String} reason - Reason for unlocking
 * @returns {Object} - Updated wallet
 */
const unlockBalance = async (driverId, amount, reason) => {
    const wallet = await Wallet.getOrCreate(driverId);

    await wallet.unlockBalance(amount);

    // Log the unlock operation
    console.log(`🔓 Unlocked ₹${amount} for driver ${driverId} - Reason: ${reason}`);

    return wallet;
};

/**
 * Process ride earning (credit with 24h lock)
 * @param {String} driverId - Driver ID
 * @param {String} userId - User ID (Passenger)
 * @param {Number} amount - Earning amount
 * @param {String} bookingId - Booking ID
 * @returns {Object} - Wallet and transaction
 */
const processRideEarning = async (driverId, userId, amount, bookingId) => {
    return await creditWallet(
        driverId,
        amount,
        'available', // Immediate availability
        'ride_earning',
        `Ride earnings from booking #${bookingId.toString().slice(-6)}`,
        { bookingId },
        userId
    );
};

/**
 * Process company commission (credit company wallet)
 * @param {Number} amount - Commission amount
 * @param {String} bookingId - Booking ID
 * @param {String} driverId - Driver ID (source of commission generation)
 * @returns {Object} - Wallet and transaction
 */
const processCompanyCommission = async (amount, bookingId, driverId) => {
    const wallet = await Wallet.getOrCreateCompanyWallet();

    await wallet.credit(amount, 'available');

    const transaction = await Transaction.create({
        type: 'credit', // Credit to company
        amount,
        description: `Commission from booking #${bookingId.toString().slice(-6)}`,
        status: 'completed',
        paymentMethod: 'system',
        driver: driverId, // Link to driver for reference, but it's company income
        metadata: {
            bookingId,
            incomeType: 'commission',
            walletType: 'company',
            newBalance: wallet.balance
        }
    });

    return { wallet, transaction };
};

/**
 * Process payout (debit available balance)
 * @param {String} driverId - Driver ID
 * @param {Number} amount - Payout amount
 * @param {Number} tax - Tax amount
 * @param {String} bankAccount - Bank account (last 4 digits)
 * @returns {Object} - Wallet and transaction
 */
const processPayout = async (driverId, amount, tax, bankAccount) => {
    const netAmount = amount - tax;

    const result = await debitWallet(
        driverId,
        netAmount,
        'available',
        'payout',
        `Payout to bank account ****${bankAccount}`,
        { grossAmount: amount, tax, netAmount }
    );

    return result;
};

/**
 * Request Payout (Initiate withdrawal)
 * @param {String} driverId - Driver ID
 * @param {Number} amount - Amount requested
 * @returns {Object} - Wallet and transaction
 */
const requestPayout = async (driverId, amount) => {
    const wallet = await Wallet.getOrCreate(driverId);

    // Check balance first
    if (wallet.availableBalance < amount) {
        throw new Error('Insufficient available balance');
    }

    // Debit the wallet (remove from available)
    // We treat this as an immediate debit. If it fails later (admin reject), we refund it.
    await wallet.debit(amount, 'available');

    // Create a PENDING transaction
    // Note: wallet.debit logs a completed transaction in its logic implementation in Wallet model? 
    // Wait, let's check Wallet.js model methods again.
    // wallet.debit does NOT create a transaction record in Transaction collection. It just updates the balance.
    // walletService.debitWallet creates the transaction record.

    // So here we should manually create the transaction to set status as 'pending'

    const transaction = await Transaction.create({
        driver: driverId,
        type: 'payout',
        amount: amount,
        description: 'Withdrawal Request',
        status: 'pending', // Pending admin approval or bank processing
        paymentMethod: 'bank_transfer',
        metadata: {
            balanceType: 'available',
            initiatedAt: new Date()
        }
    });

    return { wallet, transaction };
};

/**
 * Get wallet transaction history
 * @param {String} driverId - Driver ID
 * @param {Object} options - Query options (page, limit, type, status)
 * @returns {Object} - Transactions and pagination
 */
const getTransactionHistory = async (driverId, options = {}) => {
    const {
        page = 1,
        limit = 20,
        type = null,
        status = null,
        startDate = null,
        endDate = null
    } = options;

    const query = { driver: driverId };

    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
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
 * Get wallet statistics
 * @param {String} driverId - Driver ID
 * @param {String} period - 'today', 'week', 'month', 'all'
 * @returns {Object} - Statistics
 */
const getWalletStats = async (driverId, period = 'all') => {
    const wallet = await Wallet.getOrCreate(driverId);

    // Calculate date range
    let startDate = null;
    const now = new Date();

    switch (period) {
        case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
        case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
    }

    const query = { driver: driverId };
    if (startDate) query.createdAt = { $gte: startDate };

    // Aggregate transactions
    const stats = await Transaction.aggregate([
        { $match: query },
        {
            $group: {
                _id: '$type',
                count: { $sum: 1 },
                total: { $sum: '$amount' }
            }
        }
    ]);

    const result = {
        period,
        currentBalance: wallet.balance,
        availableBalance: wallet.availableBalance,
        lockedBalance: wallet.lockedBalance,
        lifetimeEarnings: wallet.lifetimeEarnings,
        totalWithdrawn: wallet.totalWithdrawn,
        credits: {
            count: 0,
            total: 0
        },
        debits: {
            count: 0,
            total: 0
        }
    };

    stats.forEach(stat => {
        if (stat._id === 'credit') {
            result.credits = { count: stat.count, total: stat.total };
        } else if (stat._id === 'debit') {
            result.debits = { count: stat.count, total: stat.total };
        }
    });

    return result;
};

/**
 * Freeze wallet (admin action)
 * @param {String} driverId - Driver ID
 * @param {String} reason - Freeze reason
 * @param {String} adminId - Admin user ID
 * @returns {Object} - Updated wallet
 */
const freezeWallet = async (driverId, reason, adminId) => {
    const wallet = await Wallet.getOrCreate(driverId);
    return await wallet.freeze(reason, adminId);
};

/**
 * Unfreeze wallet (admin action)
 * @param {String} driverId - Driver ID
 * @returns {Object} - Updated wallet
 */
const unfreezeWallet = async (driverId) => {
    const wallet = await Wallet.getOrCreate(driverId);
    return await wallet.unfreeze();
};

module.exports = {
    getWallet,
    getBalance,
    creditWallet,
    debitWallet,
    unlockBalance,
    processRideEarning,
    processCompanyCommission,
    processPayout,
    requestPayout,
    getTransactionHistory,
    getWalletStats,
    freezeWallet,
    unfreezeWallet
};
