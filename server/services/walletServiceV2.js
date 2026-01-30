const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const Driver = require('../models/Driver');
// phonePePayoutService removed

const mongoose = require('mongoose');

/**
 * ENHANCED WALLET SERVICE V2
 * 
 * Uses WalletTransaction (Ledger) model for complete audit trail
 * Follows industry standards (Uber, Ola, Swiggy)
 * 
 * Key Principles:
 * 1. Every money movement has a ledger entry
 * 2. Ledger is the single source of truth
 * 3. Wallet balance is derived from ledger
 * 4. Use database transactions for atomicity
 * 5. Idempotent operations
 */

/**
 * Get or create wallet for driver
 */
const getWallet = async (driverId) => {
    return await Wallet.getOrCreate(driverId);
};

/**
 * Get or create company wallet
 */
const getCompanyWallet = async () => {
    return await Wallet.getOrCreateCompanyWallet();
};

/**
 * Get wallet balance with breakdown
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
 * CREDIT WALLET (Add Money)
 * 
 * Creates ledger entry FIRST, then updates wallet balance
 * Uses database transaction for atomicity
 * 
 * @param {Object} creditData
 * @param {String} creditData.driverId - Driver ID (or null for company)
 * @param {Number} creditData.amount - Amount to credit
 * @param {String} creditData.source - Source of credit (RIDE_PAYMENT, BONUS, etc.)
 * @param {String} creditData.description - Human-readable description
 * @param {String} creditData.bookingId - Optional booking reference
 * @param {String} creditData.userId - Optional user reference
 * @param {Object} creditData.metadata - Additional metadata
 * @param {String} creditData.balanceType - 'available' or 'locked'
 * @returns {Object} - Wallet and transaction
 */
const creditWallet = async (creditData) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            driverId,
            amount,
            source,
            description,
            bookingId = null,
            userId = null,
            metadata = {},
            balanceType = 'available',
            referenceId = null
        } = creditData;

        // Validate amount
        if (amount <= 0) {
            throw new Error('Credit amount must be positive');
        }

        // Get wallet
        const wallet = driverId
            ? await Wallet.getOrCreate(driverId)
            : await Wallet.getOrCreateCompanyWallet();

        if (wallet.status !== 'active') {
            throw new Error('Wallet is not active');
        }

        // Check for duplicate transaction (idempotency)
        if (referenceId) {
            const existing = await WalletTransaction.findOne({ referenceId });
            if (existing) {
                console.log(`⚠ Duplicate transaction detected: ${referenceId}`);
                await session.abortTransaction();
                return { wallet, transaction: existing, duplicate: true };
            }
        }

        // Create ledger entry
        const transaction = await WalletTransaction.create([{
            walletId: wallet._id,
            driver: driverId,
            user: userId,
            type: 'CREDIT',
            amount,
            balanceBefore: wallet.balance,
            balanceAfter: wallet.balance + amount,
            source,
            description,
            referenceId: referenceId || `${source}_${bookingId || Date.now()}`,
            bookingId,
            status: 'COMPLETED',
            metadata: {
                ...metadata,
                balanceType
            },
            processedAt: new Date()
        }], { session });

        // Update wallet balance
        if (balanceType === 'locked') {
            wallet.lockedBalance += amount;
        } else {
            wallet.availableBalance += amount;
        }
        wallet.balance = wallet.availableBalance + wallet.lockedBalance;
        wallet.lifetimeEarnings += amount;
        wallet.lastTransactionAt = new Date();

        // Update stats
        wallet.stats.totalTransactions += 1;
        wallet.stats.totalCredits += amount;
        wallet.stats.averageTransactionAmount =
            (wallet.stats.totalCredits + wallet.stats.totalDebits) / wallet.stats.totalTransactions;

        await wallet.save({ session });

        await session.commitTransaction();

        console.log(`✅ CREDIT: ₹${amount} | Driver: ${driverId} | Source: ${source}`);

        return {
            wallet,
            transaction: transaction[0],
            duplicate: false
        };

    } catch (error) {
        await session.abortTransaction();
        console.error('❌ Credit Wallet Error:', error.message);
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * DEBIT WALLET (Remove Money)
 * 
 * Creates ledger entry FIRST, then updates wallet balance
 * Uses database transaction for atomicity
 */
const debitWallet = async (debitData) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            driverId,
            amount,
            source,
            description,
            bookingId = null,
            payoutId = null,
            metadata = {},
            balanceType = 'available',
            referenceId = null
        } = debitData;

        // Validate amount
        if (amount <= 0) {
            throw new Error('Debit amount must be positive');
        }

        // Get wallet
        const wallet = driverId
            ? await Wallet.getOrCreate(driverId)
            : await Wallet.getOrCreateCompanyWallet();

        if (wallet.status !== 'active') {
            throw new Error('Wallet is not active');
        }

        // Check balance
        const balanceToCheck = balanceType === 'locked' ? wallet.lockedBalance : wallet.availableBalance;
        if (balanceToCheck < amount) {
            throw new Error(`Insufficient ${balanceType} balance`);
        }

        // Check for duplicate transaction (idempotency)
        if (referenceId) {
            const existing = await WalletTransaction.findOne({ referenceId });
            if (existing) {
                console.log(`⚠ Duplicate transaction detected: ${referenceId}`);
                await session.abortTransaction();
                return { wallet, transaction: existing, duplicate: true };
            }
        }

        // Create ledger entry
        const transaction = await WalletTransaction.create([{
            walletId: wallet._id,
            driver: driverId,
            type: 'DEBIT',
            amount,
            balanceBefore: wallet.balance,
            balanceAfter: wallet.balance - amount,
            source,
            description,
            referenceId: referenceId || `${source}_${payoutId || bookingId || Date.now()}`,
            bookingId,
            payoutId,
            status: 'COMPLETED',
            metadata: {
                ...metadata,
                balanceType
            },
            processedAt: new Date()
        }], { session });

        // Update wallet balance
        if (balanceType === 'locked') {
            wallet.lockedBalance -= amount;
        } else {
            wallet.availableBalance -= amount;
        }
        wallet.balance = wallet.availableBalance + wallet.lockedBalance;
        wallet.totalWithdrawn += amount;
        wallet.lastTransactionAt = new Date();

        // Update stats
        wallet.stats.totalTransactions += 1;
        wallet.stats.totalDebits += amount;
        wallet.stats.averageTransactionAmount =
            (wallet.stats.totalCredits + wallet.stats.totalDebits) / wallet.stats.totalTransactions;

        await wallet.save({ session });

        await session.commitTransaction();

        console.log(`✅ DEBIT: ₹${amount} | Driver: ${driverId} | Source: ${source}`);

        return {
            wallet,
            transaction: transaction[0],
            duplicate: false
        };

    } catch (error) {
        await session.abortTransaction();
        console.error('❌ Debit Wallet Error:', error.message);
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * PROCESS RIDE EARNING (Online Payment)
 * 
 * When rider pays via UPI/Card:
 * 1. Platform receives 100% (₹500)
 * 2. Credit driver 70% (₹350)
 * 3. Credit company 30% (₹150)
 */
const processRideEarning = async (rideData) => {
    const {
        driverId,
        userId,
        bookingId,
        totalFare,
        commission,
        driverEarning,
        paymentMethod = 'UPI',
        gatewayTransactionId = null
    } = rideData;

    try {
        // Credit driver wallet
        const driverResult = await creditWallet({
            driverId,
            amount: driverEarning,
            source: 'RIDE_PAYMENT',
            description: `Ride earnings from booking #${bookingId.toString().slice(-6)}`,
            bookingId,
            userId,
            referenceId: `RIDE_${bookingId}`,
            metadata: {
                paymentMethod,
                gatewayTransactionId,
                rideDetails: {
                    fare: totalFare,
                    commission,
                    driverEarning
                }
            }
        });

        // Credit company wallet
        const companyResult = await creditWallet({
            driverId: null, // Company wallet
            amount: commission,
            source: 'COMMISSION',
            description: `Commission from booking #${bookingId.toString().slice(-6)}`,
            bookingId,
            userId,
            referenceId: `COMMISSION_${bookingId}`,
            metadata: {
                paymentMethod,
                gatewayTransactionId,
                rideDetails: {
                    fare: totalFare,
                    commission,
                    driverEarning
                },
                driverId // Track which driver generated this commission
            }
        });

        console.log(`✅ Ride earning processed: Driver ₹${driverEarning} | Company ₹${commission}`);

        return {
            driverTransaction: driverResult.transaction,
            companyTransaction: companyResult.transaction
        };

    } catch (error) {
        console.error('❌ Process Ride Earning Error:', error.message);
        throw error;
    }
};

/**
 * PROCESS CASH RIDE
 * 
 * When rider pays cash:
 * 1. Driver collects 100% (₹500)
 * 2. Credit driver 70% (₹350)
 * 3. Debit driver 30% (₹150) - commission owed
 * 4. Credit company 30% (₹150)
 */
const processCashRide = async (rideData) => {
    const {
        driverId,
        userId,
        bookingId,
        totalFare,
        commission,
        driverEarning
    } = rideData;

    try {
        // Credit driver earnings
        const driverCreditResult = await creditWallet({
            driverId,
            amount: driverEarning,
            source: 'RIDE_PAYMENT',
            description: `Cash ride earnings from booking #${bookingId.toString().slice(-6)}`,
            bookingId,
            userId,
            referenceId: `CASH_RIDE_${bookingId}`,
            metadata: {
                paymentMethod: 'CASH',
                cashDetails: {
                    collectedAmount: totalFare,
                    commissionOwed: commission
                },
                rideDetails: {
                    fare: totalFare,
                    commission,
                    driverEarning
                }
            }
        });

        // Try to debit commission from driver wallet
        let driverDebitResult;
        let commissionPending = false;

        try {
            driverDebitResult = await debitWallet({
                driverId,
                amount: commission,
                source: 'COMMISSION_DEDUCTION',
                description: `Commission for cash ride #${bookingId.toString().slice(-6)}`,
                bookingId,
                referenceId: `CASH_COMMISSION_${bookingId}`,
                metadata: {
                    paymentMethod: 'CASH',
                    cashDetails: {
                        collectedAmount: totalFare
                    }
                }
            });

            // Credit company wallet
            await creditWallet({
                driverId: null,
                amount: commission,
                source: 'COMMISSION',
                description: `Commission from cash ride #${bookingId.toString().slice(-6)}`,
                bookingId,
                userId,
                referenceId: `CASH_COMMISSION_COMPANY_${bookingId}`,
                metadata: {
                    paymentMethod: 'CASH',
                    driverId,
                    rideDetails: {
                        fare: totalFare,
                        commission,
                        driverEarning
                    }
                }
            });

        } catch (error) {
            // Insufficient balance - mark as pending dues
            console.warn(`⚠ Insufficient balance for commission deduction. Creating pending due.`);
            commissionPending = true;

            // TODO: Create PendingDues entry or handle via other mechanism
            // For now, we'll just log it
        }

        console.log(`✅ Cash ride processed: Driver ₹${driverEarning} | Commission ${commissionPending ? 'PENDING' : 'DEDUCTED'}`);

        return {
            driverCreditTransaction: driverCreditResult.transaction,
            driverDebitTransaction: driverDebitResult?.transaction,
            commissionPending
        };

    } catch (error) {
        console.error('❌ Process Cash Ride Error:', error.message);
        throw error;
    }
};

/**
 * REQUEST PAYOUT (Driver Withdrawal)
 * 
 * 1. Validate balance and bank details
 * 2. Initiate PhonePe payout
 * 3. Create pending ledger entry
 * 4. Debit wallet (mark as pending)
 */
const requestPayout = async (payoutData) => {
    const {
        driverId,
        amount
    } = payoutData;

    try {
        // Get wallet and driver details
        const wallet = await Wallet.getOrCreate(driverId);
        const driver = await Driver.findById(driverId);

        // Validations
        if (wallet.availableBalance < amount) {
            throw new Error('Insufficient available balance');
        }

        if (amount < 100) {
            throw new Error('Minimum withdrawal amount is ₹100');
        }

        if (wallet.status !== 'active') {
            throw new Error('Wallet is not active');
        }

        if (driver.bankDetails?.verificationStatus !== 'verified') {
            // Allow if benficiaryId exists (Razorpay setup)
            if (!driver.bankDetails?.beneficiaryId) {
                throw new Error('Bank details not verified');
            }
        }

        // Generate payout ID
        const payoutId = `PAYOUT_${driverId}_${Date.now()}`;

        // Create ledger entry (PENDING)
        const debitResult = await debitWallet({
            driverId,
            amount,
            source: 'PAYOUT',
            description: `Withdrawal to bank account ****${driver.bankDetails.accountNumber.slice(-4)}`,
            payoutId,
            referenceId: payoutId,
            metadata: {
                paymentMethod: 'BANK_TRANSFER',
                payoutDetails: {
                    bankAccount: driver.bankDetails.accountNumber,
                    // If benficiaryId exists, it will be used by controller
                    beneficiaryId: driver.bankDetails.beneficiaryId
                }
            }
        });

        // Update transaction status to PENDING (it was created as COMPLETED by default in debitWallet logic, 
        // effectively we want to debit immediately from 'available' but mark the transaction status as pending/processing)
        await WalletTransaction.findByIdAndUpdate(debitResult.transaction._id, {
            status: 'PENDING'
        });

        console.log(`✅ Payout requested: ₹${amount} | PayoutID: ${payoutId}`);

        return {
            payoutId,
            amount,
            status: 'PENDING',
            wallet: debitResult.wallet, // Return updated wallet
            transactionId: debitResult.transaction._id
        };

    } catch (error) {
        console.error('❌ Request Payout Error:', error.message);
        throw error;
    }
};

/**
 * UPDATE PAYOUT STATUS (Webhook Handler)
 * 
 * Called when PhonePe sends payout status update
 */
const updatePayoutStatus = async (payoutId, status, metadata = {}) => {
    try {
        const transaction = await WalletTransaction.findOne({ payoutId });

        if (!transaction) {
            throw new Error('Payout transaction not found');
        }

        // Update transaction status
        transaction.status = status; // 'COMPLETED' or 'FAILED'
        transaction.metadata.payoutDetails = {
            ...transaction.metadata.payoutDetails,
            ...metadata,
            updatedAt: new Date()
        };

        await transaction.save();

        // If failed, refund the amount
        if (status === 'FAILED') {
            await creditWallet({
                driverId: transaction.driver,
                amount: transaction.amount,
                source: 'REFUND',
                description: `Refund for failed payout ${payoutId}`,
                referenceId: `REFUND_${payoutId}`,
                metadata: {
                    originalPayoutId: payoutId,
                    reason: metadata.failureReason || 'Payout failed'
                }
            });

            console.log(`✅ Payout failed, amount refunded: ₹${transaction.amount}`);
        } else {
            console.log(`✅ Payout completed: ₹${transaction.amount} | PayoutID: ${payoutId}`);
        }

        return transaction;

    } catch (error) {
        console.error('❌ Update Payout Status Error:', error.message);
        throw error;
    }
};

/**
 * GET TRANSACTION HISTORY
 */
const getTransactionHistory = async (driverId, options = {}) => {
    const wallet = await Wallet.getOrCreate(driverId);
    return await WalletTransaction.getHistory(wallet._id, options);
};

/**
 * GET WALLET STATISTICS
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

    const query = { walletId: wallet._id, status: 'COMPLETED' };
    if (startDate) query.createdAt = { $gte: startDate };

    const stats = await WalletTransaction.aggregate([
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
        credits: { count: 0, total: 0 },
        debits: { count: 0, total: 0 }
    };

    stats.forEach(stat => {
        if (stat._id === 'CREDIT') {
            result.credits = { count: stat.count, total: stat.total };
        } else if (stat._id === 'DEBIT') {
            result.debits = { count: stat.count, total: stat.total };
        }
    });

    return result;
};

/**
 * RECONCILE WALLET BALANCE
 * 
 * Compare wallet balance with ledger-calculated balance
 * Used for daily reconciliation
 */
const reconcileWallet = async (driverId) => {
    const wallet = await Wallet.getOrCreate(driverId);
    const ledgerSummary = await WalletTransaction.getBalanceSummary(wallet._id);

    const discrepancy = Math.abs(ledgerSummary.calculatedBalance - wallet.balance);

    return {
        walletBalance: wallet.balance,
        ledgerBalance: ledgerSummary.calculatedBalance,
        discrepancy,
        isBalanced: discrepancy === 0,
        details: ledgerSummary
    };
};

module.exports = {
    getWallet,
    getCompanyWallet,
    getBalance,
    creditWallet,
    debitWallet,
    processRideEarning,
    processCashRide,
    requestPayout,
    updatePayoutStatus,
    getTransactionHistory,
    getWalletStats,
    reconcileWallet
};
