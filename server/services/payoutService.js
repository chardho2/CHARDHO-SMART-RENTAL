const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const Driver = require('../models/Driver');
const walletService = require('./walletService');

/**
 * PAYOUT SERVICE
 * Handles all payout-related business logic
 */

const MIN_PAYOUT_THRESHOLD = 100; // ₹100
const TDS_RATE = 0.01; // 1%
const COMMISSION_RATE = 0.30; // 30%

/**
 * Calculate commission and driver earnings for a completed ride
 * @param {Number} totalFare - Total ride fare
 * @returns {Object} - Commission and earnings breakdown
 */
const calculateEarnings = (totalFare) => {
    const commission = Math.round(totalFare * COMMISSION_RATE);
    const driverEarnings = Math.round(totalFare - commission);

    return {
        commission,
        driverEarnings,
        totalFare
    };
};

/**
 * Process ride completion and create pending transaction
 * @param {Object} booking - Booking document
 * @returns {Object} - Updated booking and transaction
 */
/**
 * Process ride completion and handle financial settlement
 * @param {Object} booking - Booking document
 * @returns {Object} - Updated booking and transaction
 */
const processRideCompletion = async (booking) => {
    try {
        const { commission, driverEarnings } = calculateEarnings(booking.fare.total);

        // Set payout eligibility to IMMEDIATE (No 24h lock)
        const payoutEligibleAt = new Date();

        // Update booking with financial details
        booking.commission = commission;
        booking.driverEarnings = driverEarnings;
        booking.payoutStatus = 'eligible'; // Immediately eligible
        booking.payoutEligibleAt = payoutEligibleAt;

        await booking.save();

        let transaction;

        if (booking.payment && booking.payment.method === 'cash') {
            // --- CASH PAYMENT ---
            // Driver collected 100% (Fare).
            // Driver owes Platform 30% (Commission).
            // Action: DEBIT driver wallet for Commission.
            try {
                const result = await walletService.debitWallet(
                    booking.driver,
                    commission,
                    'available',
                    'commission',
                    `Commission for Cash Ride #${booking._id.toString().slice(-6)}`,
                    { bookingId: booking._id }
                );
                transaction = result.transaction;
            } catch (err) {
                console.error('❌ Failed to debit commission from driver wallet (Cash Ride):', err.message);
                // We might want to mark this as "Pending Debt" if wallet has insufficient funds
            }

            // Company Wallet Credit (Commission) - We virtually collected it via debit
            try {
                await walletService.processCompanyCommission(
                    commission,
                    booking._id,
                    booking.driver
                );
            } catch (e) {
                console.error('❌ Failed to credit company commission:', e.message);
            }

        } else {
            // --- ONLINE PAYMENT (PhonePe/UPI) ---
            // Platform collected 100% (Fare).
            // Platform owes Driver 70% (Earnings).
            // Action: CREDIT driver wallet for Earnings.

            try {
                // Use WalletService to credit the earnings
                const result = await walletService.processRideEarning(
                    booking.driver,
                    booking.user,
                    driverEarnings,
                    booking._id
                );
                transaction = result.transaction;
                console.log(`✅ Driver wallet credited: ₹${driverEarnings}`);
            } catch (err) {
                console.error('❌ Failed to credit driver earnings:', err.message);
                throw err; // Re-throw to prevent silent failure
            }

            // Company Wallet Credit (Commission) - We already have it
            try {
                await walletService.processCompanyCommission(
                    commission,
                    booking._id,
                    booking.driver
                );
                console.log(`✅ Company commission recorded: ₹${commission}`);
            } catch (e) {
                console.error('❌ Failed to credit company commission:', e.message);
            }
        }

        return {
            booking,
            transaction,
            earnings: { commission, driverEarnings }
        };
    } catch (error) {
        console.error('❌ processRideCompletion failed:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    }
};

/**
 * Get financial summary for a driver
 * @param {String} driverId - Driver ID
 * @returns {Object} - Financial summary
 */
const getFinancialSummary = async (driverId) => {
    // SCALABILITY FIX: Use Wallet model (O(1)) instead of aggregating Bookings (O(N))
    const walletData = await walletService.getBalance(driverId);

    // Get recent transactions from Wallet Service
    const { transactions } = await walletService.getTransactionHistory(driverId, { limit: 20 });

    const formattedTransactions = transactions.map(tx => {
        // Map backend status/type to frontend expected format
        let status = tx.status;
        let type = tx.type === 'credit' ? 'ride_earning' : 'payout';

        if (tx.type === 'credit' && tx.status === 'pending') {
            status = 'locked';
        }

        // Handle the payout transaction created by requestPayout
        if (tx.type === 'payout' && tx.status === 'pending') {
            type = 'payout'; // or 'withdrawal'
        }

        return {
            id: tx._id,
            type: type,
            amount: tx.amount,
            date: tx.createdAt,
            status: status,
            description: tx.description
        };
    });

    // Get bank verification status
    const driver = await Driver.findById(driverId).select('bankDetails');
    const bankStatus = driver.bankDetails?.verificationStatus || 'pending';

    return {
        walletBalance: walletData.totalBalance,
        payoutEligibleBalance: walletData.availableBalance,
        lockedBalance: walletData.lockedBalance,
        currency: walletData.currency || 'INR',
        minPayoutThreshold: MIN_PAYOUT_THRESHOLD,
        nextPayoutEstimation: new Date().setHours(26, 0, 0, 0), // Tomorrow 2AM
        bankVerificationStatus: bankStatus,
        recentTransactions: formattedTransactions
    };
};

/**
 * Process payouts for eligible drivers
 * @returns {Object} - Payout processing results
 */
const processEligiblePayouts = async () => {
    const now = new Date();

    // Find eligible bookings
    const eligibleBookings = await Booking.find({
        status: 'completed',
        payoutStatus: 'pending',
        payoutEligibleAt: { $lte: now }
    }).populate('driver');

    if (eligibleBookings.length === 0) {
        return { processedCount: 0, totalAmount: 0 };
    }

    // Group by driver
    const payouts = {};

    for (const booking of eligibleBookings) {
        if (!booking.driver) continue;

        const dId = booking.driver._id.toString();
        if (!payouts[dId]) {
            payouts[dId] = {
                driver: booking.driver,
                bookings: [],
                totalAmount: 0
            };
        }

        payouts[dId].bookings.push(booking);
        const earnings = booking.driverEarnings || (booking.fare.total * 0.9);
        payouts[dId].totalAmount += earnings;
    }

    let processedCount = 0;
    let totalPaidOut = 0;

    // Process each driver
    for (const driverId in payouts) {
        const { driver, bookings, totalAmount } = payouts[driverId];

        // Validation checks
        if (driver.bankDetails?.verificationStatus !== 'verified') continue;
        if (totalAmount < MIN_PAYOUT_THRESHOLD) continue;
        if (!driver.bankDetails?.accountNumber || !driver.bankDetails?.ifscCode) continue;

        // Calculate payout with TDS
        const taxAmount = Math.round(totalAmount * TDS_RATE);
        const payoutAmount = Math.round(totalAmount - taxAmount);

        // TODO: Integrate real bank transfer API here

        // Create payout transaction
        await Transaction.create({
            driver: driver._id,
            user: bookings[0].user,
            type: 'payout',
            amount: payoutAmount,
            tax: taxAmount,
            description: `Daily Payout (Ref: ${Date.now()})`,
            status: 'completed',
            paymentMethod: 'bank_transfer'
        });

        // Update bookings
        const bookingIds = bookings.map(b => b._id);
        await Booking.updateMany(
            { _id: { $in: bookingIds } },
            { $set: { payoutStatus: 'processed' } }
        );

        processedCount++;
        totalPaidOut += payoutAmount;
    }

    return {
        processedCount,
        totalAmount: totalPaidOut,
        eligibleBookings: eligibleBookings.length
    };
};

module.exports = {
    calculateEarnings,
    processRideCompletion,
    getFinancialSummary,
    processEligiblePayouts,
    MIN_PAYOUT_THRESHOLD,
    TDS_RATE,
    COMMISSION_RATE
};
