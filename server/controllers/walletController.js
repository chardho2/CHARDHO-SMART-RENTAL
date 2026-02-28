const walletService = require('../services/walletService');

/**
 * WALLET CONTROLLER
 * Handles HTTP requests for wallet operations
 */

/**
 * Get wallet balance
 */
const getWalletBalance = async (req, res) => {
    try {
        const balance = await walletService.getBalance(req.user._id);

        res.json({
            success: true,
            balance
        });
    } catch (error) {
        console.error('Get wallet balance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get wallet balance',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get wallet details
 */
const getWalletDetails = async (req, res) => {
    try {
        const wallet = await walletService.getWallet(req.user._id);

        res.json({
            success: true,
            wallet: {
                balance: wallet.balance,
                availableBalance: wallet.availableBalance,
                lockedBalance: wallet.lockedBalance,
                lifetimeEarnings: wallet.lifetimeEarnings,
                totalWithdrawn: wallet.totalWithdrawn,
                currency: wallet.currency,
                status: wallet.status,
                stats: wallet.stats,
                lastTransactionAt: wallet.lastTransactionAt
            }
        });
    } catch (error) {
        console.error('Get wallet details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get wallet details',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get transaction history
 */
const getTransactionHistory = async (req, res) => {
    try {
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            type: req.query.type,
            status: req.query.status,
            startDate: req.query.startDate,
            endDate: req.query.endDate
        };

        const result = await walletService.getTransactionHistory(req.user._id, options);

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Get transaction history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get transaction history',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get wallet statistics
 */
const getWalletStats = async (req, res) => {
    try {
        const period = req.query.period || 'all';
        const stats = await walletService.getWalletStats(req.user._id, period);

        res.json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Get wallet stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get wallet statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Request withdrawal (manual payout request)
 */
const requestWithdrawal = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }

        // Create withdrawal request
        const { wallet, transaction } = await walletService.requestPayout(req.user._id, amount);

        res.json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            amount,
            referenceId: transaction._id,
            newBalance: wallet.availableBalance,
            estimatedProcessingTime: '1-2 business days'
        });
    } catch (error) {
        console.error('Request withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process withdrawal request',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getWalletBalance,
    getWalletDetails,
    getTransactionHistory,
    getWalletStats,
    requestWithdrawal
};
