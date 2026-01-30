const express = require('express');
const router = express.Router();
const walletServiceV2 = require('../services/walletServiceV2');
// phonePePayoutService removed

const { authenticateToken, requireDriver } = require('../middleware/auth');

/**
 * WALLET API ROUTES
 * 
 * All routes follow RESTful conventions
 * Authentication required for all endpoints
 */

// ========================================
// DRIVER WALLET ENDPOINTS
// ========================================

/**
 * GET /api/wallet/balance
 * Get wallet balance and details
 */
router.get('/balance', authenticateToken, requireDriver, async (req, res) => {
    try {
        const driverId = req.user._id;
        const balance = await walletServiceV2.getBalance(driverId);

        res.json({
            success: true,
            data: balance
        });
    } catch (error) {
        console.error('❌ Get Balance Error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/wallet/transactions
 * Get transaction history with pagination
 * 
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20)
 * - type: CREDIT | DEBIT
 * - source: RIDE_PAYMENT | PAYOUT | etc.
 * - startDate: ISO date string
 * - endDate: ISO date string
 */
router.get('/transactions', authenticateToken, requireDriver, async (req, res) => {
    try {
        const driverId = req.user._id;
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            type: req.query.type,
            source: req.query.source,
            startDate: req.query.startDate,
            endDate: req.query.endDate
        };

        const result = await walletServiceV2.getTransactionHistory(driverId, options);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('❌ Get Transactions Error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/wallet/stats
 * Get wallet statistics
 * 
 * Query params:
 * - period: today | week | month | all (default: all)
 */
router.get('/stats', authenticateToken, requireDriver, async (req, res) => {
    try {
        const driverId = req.user._id;
        const period = req.query.period || 'all';

        const stats = await walletServiceV2.getWalletStats(driverId, period);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('❌ Get Stats Error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/wallet/withdraw
 * Request withdrawal to bank account
 * 
 * Body:
 * - amount: number (in rupees)
 */
router.post('/withdraw', authenticateToken, requireDriver, async (req, res) => {
    try {
        const driverId = req.user._id;
        const { amount } = req.body;

        // Validate input
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        const result = await walletServiceV2.requestPayout({
            driverId,
            amount
        });

        res.json({
            success: true,
            data: result,
            message: 'Withdrawal request submitted successfully'
        });
    } catch (error) {
        console.error('❌ Withdraw Error:', error.message);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * GET /api/wallet/reconcile
 * Reconcile wallet balance with ledger
 * (For debugging/admin purposes)
 */
router.get('/reconcile', authenticateToken, requireDriver, async (req, res) => {
    try {
        const driverId = req.user._id;
        const result = await walletServiceV2.reconcileWallet(driverId);

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('❌ Reconcile Error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ========================================
// PAYOUT WEBHOOK ENDPOINT
// ========================================

// Payout callback and status routes removed as PhonePe is removed


/**
 * POST /api/wallet/admin/reconcile-all
 * Reconcile all driver wallets
 */
router.post('/admin/reconcile-all', authenticateToken, async (req, res) => {
    try {
        const Driver = require('../models/Driver');
        const drivers = await Driver.find({ status: 'approved' }).select('_id');

        const results = [];
        let mismatches = 0;

        for (const driver of drivers) {
            const result = await walletServiceV2.reconcileWallet(driver._id);

            if (!result.isBalanced) {
                mismatches++;
                results.push({
                    driverId: driver._id,
                    ...result
                });
            }
        }

        res.json({
            success: true,
            data: {
                totalDrivers: drivers.length,
                mismatches,
                details: results
            }
        });
    } catch (error) {
        console.error('❌ Reconcile All Error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/wallet/admin/credit
 * Manual credit (bonus, refund, etc.)
 */
router.post('/admin/credit', authenticateToken, async (req, res) => {
    try {
        const {
            driverId,
            amount,
            source,
            description,
            metadata
        } = req.body;

        const result = await walletServiceV2.creditWallet({
            driverId,
            amount,
            source,
            description,
            metadata: {
                ...metadata,
                adminDetails: {
                    adminId: req.admin._id,
                    reason: description,
                    approvedAt: new Date()
                }
            }
        });

        res.json({
            success: true,
            data: result,
            message: 'Wallet credited successfully'
        });
    } catch (error) {
        console.error('❌ Admin Credit Error:', error.message);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * POST /api/wallet/admin/debit
 * Manual debit (penalty, adjustment, etc.)
 */
router.post('/admin/debit', authenticateToken, async (req, res) => {
    try {
        const {
            driverId,
            amount,
            source,
            description,
            metadata
        } = req.body;

        const result = await walletServiceV2.debitWallet({
            driverId,
            amount,
            source,
            description,
            metadata: {
                ...metadata,
                adminDetails: {
                    adminId: req.admin._id,
                    reason: description,
                    approvedAt: new Date()
                }
            }
        });

        res.json({
            success: true,
            data: result,
            message: 'Wallet debited successfully'
        });
    } catch (error) {
        console.error('❌ Admin Debit Error:', error.message);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
