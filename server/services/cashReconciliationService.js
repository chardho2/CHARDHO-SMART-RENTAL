const PendingDues = require('../models/PendingDues');
const WalletTransaction = require('../models/WalletTransaction');
const walletServiceV2 = require('./walletServiceV2');
const Driver = require('../models/Driver');

/**
 * CASH RECONCILIATION SERVICE
 * 
 * Handles tracking and settlement of cash ride commissions
 * 
 * Key Features:
 * 1. Track pending dues when driver has insufficient balance
 * 2. Auto-deduct from future earnings
 * 3. Send reminders
 * 4. Admin waiver support
 * 5. Reporting
 */

/**
 * Create pending due for cash commission
 * 
 * Called when driver doesn't have sufficient balance to pay commission
 */
const createPendingDue = async (dueData) => {
    const {
        driverId,
        amount,
        reason,
        description,
        bookingId,
        dueDate = null,
        priority = 'MEDIUM'
    } = dueData;

    try {
        const pendingDue = await PendingDues.create({
            driver: driverId,
            amount,
            originalAmount: amount,
            reason,
            description,
            bookingId,
            dueDate,
            priority,
            status: 'PENDING'
        });

        console.log(`📝 Pending due created: ₹${amount} | Driver: ${driverId}`);

        return pendingDue;

    } catch (error) {
        console.error('❌ Create Pending Due Error:', error.message);
        throw error;
    }
};

/**
 * Auto-deduct pending dues from driver earnings
 * 
 * Called after crediting driver wallet for a ride
 */
const autoDeductPendingDues = async (driverId, availableAmount) => {
    try {
        // Get all pending dues for driver
        const pendingDues = await PendingDues.find({
            driver: driverId,
            status: { $in: ['PENDING', 'PARTIALLY_SETTLED'] }
        }).sort({ createdAt: 1 }); // Oldest first

        if (pendingDues.length === 0) {
            return {
                deducted: 0,
                remaining: availableAmount,
                settlements: []
            };
        }

        let remainingAmount = availableAmount;
        const settlements = [];

        for (const due of pendingDues) {
            if (remainingAmount <= 0) break;

            const deductAmount = Math.min(remainingAmount, due.amount);

            // Debit from wallet
            const debitResult = await walletServiceV2.debitWallet({
                driverId,
                amount: deductAmount,
                source: 'CASH_SETTLEMENT',
                description: `Settlement of pending due: ${due.description}`,
                referenceId: `SETTLEMENT_${due._id}_${Date.now()}`,
                metadata: {
                    pendingDueId: due._id,
                    originalAmount: due.originalAmount,
                    remainingDue: due.amount - deductAmount
                }
            });

            // Record settlement
            await due.addSettlement(
                deductAmount,
                'AUTO_DEDUCTION',
                debitResult.transaction._id,
                'Auto-deducted from ride earnings'
            );

            // Credit company wallet
            await walletServiceV2.creditWallet({
                driverId: null, // Company wallet
                amount: deductAmount,
                source: 'COMMISSION',
                description: `Commission settlement from driver ${driverId}`,
                referenceId: `COMMISSION_SETTLEMENT_${due._id}_${Date.now()}`,
                metadata: {
                    pendingDueId: due._id,
                    driverId,
                    settlementType: 'AUTO_DEDUCTION'
                }
            });

            remainingAmount -= deductAmount;

            settlements.push({
                dueId: due._id,
                amount: deductAmount,
                description: due.description,
                status: due.status
            });

            console.log(`✅ Auto-deducted: ₹${deductAmount} | Due: ${due._id}`);
        }

        const totalDeducted = availableAmount - remainingAmount;

        return {
            deducted: totalDeducted,
            remaining: remainingAmount,
            settlements
        };

    } catch (error) {
        console.error('❌ Auto-Deduct Error:', error.message);
        throw error;
    }
};

/**
 * Enhanced process cash ride with pending dues handling
 */
const processCashRideWithDues = async (rideData) => {
    const {
        driverId,
        userId,
        bookingId,
        totalFare,
        commission,
        driverEarning
    } = rideData;

    try {
        // Step 1: Credit driver earnings
        const creditResult = await walletServiceV2.creditWallet({
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

        // Step 2: Try to deduct commission
        let commissionDeducted = false;
        let pendingDueCreated = false;

        try {
            await walletServiceV2.debitWallet({
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
            await walletServiceV2.creditWallet({
                driverId: null,
                amount: commission,
                source: 'COMMISSION',
                description: `Commission from cash ride #${bookingId.toString().slice(-6)}`,
                bookingId,
                userId,
                referenceId: `CASH_COMMISSION_COMPANY_${bookingId}`,
                metadata: {
                    paymentMethod: 'CASH',
                    driverId
                }
            });

            commissionDeducted = true;

        } catch (error) {
            // Insufficient balance - create pending due
            console.warn(`⚠ Insufficient balance. Creating pending due for ₹${commission}`);

            await createPendingDue({
                driverId,
                amount: commission,
                reason: 'CASH_COMMISSION',
                description: `Commission for cash ride #${bookingId.toString().slice(-6)}`,
                bookingId,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                priority: 'MEDIUM'
            });

            pendingDueCreated = true;
        }

        // Step 3: Auto-deduct any other pending dues
        const deductionResult = await autoDeductPendingDues(
            driverId,
            creditResult.wallet.availableBalance
        );

        console.log(`✅ Cash ride processed | Commission: ${commissionDeducted ? 'DEDUCTED' : 'PENDING'} | Auto-deductions: ₹${deductionResult.deducted}`);

        return {
            creditTransaction: creditResult.transaction,
            commissionDeducted,
            pendingDueCreated,
            autoDeductions: deductionResult
        };

    } catch (error) {
        console.error('❌ Process Cash Ride Error:', error.message);
        throw error;
    }
};

/**
 * Get pending dues summary for driver
 */
const getPendingDuesSummary = async (driverId) => {
    try {
        const totalDues = await PendingDues.getTotalDues(driverId);

        const dues = await PendingDues.find({
            driver: driverId,
            status: { $in: ['PENDING', 'PARTIALLY_SETTLED'] }
        }).sort({ createdAt: -1 });

        return {
            totalAmount: totalDues.totalAmount,
            count: totalDues.count,
            dues: dues.map(due => ({
                id: due._id,
                amount: due.amount,
                originalAmount: due.originalAmount,
                reason: due.reason,
                description: due.description,
                status: due.status,
                createdAt: due.createdAt,
                dueDate: due.dueDate,
                isOverdue: due.isOverdue,
                settlements: due.settlements
            }))
        };

    } catch (error) {
        console.error('❌ Get Pending Dues Error:', error.message);
        throw error;
    }
};

/**
 * Manual settlement of pending due
 * 
 * Used when driver pays offline or admin manually settles
 */
const manualSettlement = async (dueId, amount, adminId, notes) => {
    try {
        const due = await PendingDues.findById(dueId);

        if (!due) {
            throw new Error('Pending due not found');
        }

        if (due.status === 'SETTLED' || due.status === 'WAIVED') {
            throw new Error('Due already settled or waived');
        }

        // Record settlement
        await due.addSettlement(
            amount,
            'MANUAL_PAYMENT',
            null,
            notes || 'Manual settlement by admin'
        );

        // Credit company wallet
        await walletServiceV2.creditWallet({
            driverId: null,
            amount,
            source: 'COMMISSION',
            description: `Manual settlement: ${due.description}`,
            referenceId: `MANUAL_SETTLEMENT_${dueId}_${Date.now()}`,
            metadata: {
                pendingDueId: dueId,
                driverId: due.driver,
                settlementType: 'MANUAL_PAYMENT',
                adminDetails: {
                    adminId,
                    notes
                }
            }
        });

        console.log(`✅ Manual settlement: ₹${amount} | Due: ${dueId}`);

        return due;

    } catch (error) {
        console.error('❌ Manual Settlement Error:', error.message);
        throw error;
    }
};

/**
 * Waive pending due
 * 
 * Admin can waive dues (forgive the debt)
 */
const waiveDue = async (dueId, adminId, reason) => {
    try {
        const due = await PendingDues.findById(dueId);

        if (!due) {
            throw new Error('Pending due not found');
        }

        if (due.status === 'SETTLED') {
            throw new Error('Due already settled');
        }

        await due.waive(adminId, reason);

        console.log(`✅ Due waived: ₹${due.amount} | Reason: ${reason}`);

        return due;

    } catch (error) {
        console.error('❌ Waive Due Error:', error.message);
        throw error;
    }
};

/**
 * Send reminder to driver about pending dues
 */
const sendDueReminder = async (dueId) => {
    try {
        const due = await PendingDues.findById(dueId).populate('driver', 'name phone email');

        if (!due || due.status === 'SETTLED' || due.status === 'WAIVED') {
            return;
        }

        // TODO: Integrate with notification service
        // For now, just log
        console.log(`📧 Reminder sent to driver ${due.driver.name} for ₹${due.amount}`);

        due.remindersSent += 1;
        due.lastReminderAt = new Date();
        await due.save();

        return due;

    } catch (error) {
        console.error('❌ Send Reminder Error:', error.message);
        throw error;
    }
};

/**
 * Get overdue dues report
 */
const getOverdueReport = async () => {
    try {
        const overdueDues = await PendingDues.getOverdueDues();

        const summary = {
            totalCount: overdueDues.length,
            totalAmount: overdueDues.reduce((sum, due) => sum + due.amount, 0),
            byPriority: {
                URGENT: 0,
                HIGH: 0,
                MEDIUM: 0,
                LOW: 0
            },
            dues: []
        };

        overdueDues.forEach(due => {
            summary.byPriority[due.priority]++;
            summary.dues.push({
                id: due._id,
                driver: {
                    id: due.driver._id,
                    name: due.driver.name,
                    phone: due.driver.phone
                },
                amount: due.amount,
                originalAmount: due.originalAmount,
                reason: due.reason,
                description: due.description,
                createdAt: due.createdAt,
                dueDate: due.dueDate,
                daysOverdue: Math.floor((new Date() - due.dueDate) / (1000 * 60 * 60 * 24)),
                remindersSent: due.remindersSent
            });
        });

        return summary;

    } catch (error) {
        console.error('❌ Get Overdue Report Error:', error.message);
        throw error;
    }
};

/**
 * Daily reconciliation job
 * 
 * Run this as a cron job every day
 */
const dailyReconciliation = async () => {
    try {
        console.log('🔄 Starting daily cash reconciliation...');

        // Get all drivers with pending dues
        const driversWithDues = await PendingDues.distinct('driver', {
            status: { $in: ['PENDING', 'PARTIALLY_SETTLED'] }
        });

        console.log(`📊 Drivers with pending dues: ${driversWithDues.length}`);

        // Send reminders for overdue dues
        const overdueDues = await PendingDues.find({
            status: { $in: ['PENDING', 'PARTIALLY_SETTLED'] },
            dueDate: { $lt: new Date() },
            $or: [
                { lastReminderAt: { $exists: false } },
                { lastReminderAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Last reminder > 24h ago
            ]
        });

        for (const due of overdueDues) {
            await sendDueReminder(due._id);
        }

        console.log(`📧 Reminders sent: ${overdueDues.length}`);

        // Generate report
        const report = await getOverdueReport();

        console.log('✅ Daily reconciliation completed');
        console.log(`   Total overdue: ₹${report.totalAmount} (${report.totalCount} dues)`);

        return report;

    } catch (error) {
        console.error('❌ Daily Reconciliation Error:', error.message);
        throw error;
    }
};

module.exports = {
    createPendingDue,
    autoDeductPendingDues,
    processCashRideWithDues,
    getPendingDuesSummary,
    manualSettlement,
    waiveDue,
    sendDueReminder,
    getOverdueReport,
    dailyReconciliation
};
