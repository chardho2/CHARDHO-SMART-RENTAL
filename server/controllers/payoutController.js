const payoutService = require('../services/payoutService');

/**
 * PAYOUT CONTROLLER
 * Handles HTTP requests for payout-related operations
 */

/**
 * Get financial summary for authenticated driver
 */
const getFinancialSummary = async (req, res) => {
    try {
        const summary = await payoutService.getFinancialSummary(req.user._id);

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Financial summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get financial summary',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Process payouts manually (admin endpoint)
 * This should typically be called by a cron job
 */
const processPayouts = async (req, res) => {
    try {
        console.log('💰 Manual payout processing triggered');

        const result = await payoutService.processEligiblePayouts();

        res.json({
            success: true,
            message: 'Payout processing completed',
            data: result
        });
    } catch (error) {
        console.error('Payout processing error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process payouts',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getFinancialSummary,
    processPayouts
};
