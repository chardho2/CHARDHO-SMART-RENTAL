const bankVerificationService = require('../services/bankVerificationService');

/**
 * BANK DETAILS CONTROLLER
 * Handles HTTP requests for bank details management
 */

/**
 * Get bank details for authenticated driver
 */
const getBankDetails = async (req, res) => {
    try {
        const bankDetails = await bankVerificationService.getBankDetails(req.user._id);

        if (!bankDetails) {
            return res.json({
                success: true,
                bankDetails: null,
                message: 'No bank details found'
            });
        }

        res.json({
            success: true,
            bankDetails
        });
    } catch (error) {
        console.error('Get bank details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bank details',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update bank details for authenticated driver
 */
const updateBankDetails = async (req, res) => {
    try {
        const { accountNumber, ifscCode, accountHolderName } = req.body;

        if (!accountNumber || !ifscCode || !accountHolderName) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const driver = await bankVerificationService.updateBankDetails(req.user._id, {
            accountNumber,
            ifscCode,
            accountHolderName
        });

        res.json({
            success: true,
            message: 'Bank details updated successfully',
            bankDetails: driver.bankDetails
        });
    } catch (error) {
        console.error('Update bank details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update bank details',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Delete bank details for authenticated driver
 */
const deleteBankDetails = async (req, res) => {
    try {
        await bankVerificationService.deleteBankDetails(req.user._id);

        res.json({
            success: true,
            message: 'Bank details deleted successfully'
        });
    } catch (error) {
        console.error('Delete bank details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete bank details',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Verify bank details for authenticated driver
 */
const verifyBankDetails = async (req, res) => {
    try {
        console.log('🔍 Verifying bank details for driver:', req.user._id);

        const Driver = require('../models/Driver');
        const driver = await Driver.findById(req.user._id);

        if (!driver) {
            console.error('❌ Driver not found');
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        console.log('📋 Driver bank details:', driver.bankDetails);

        if (!driver.bankDetails) {
            console.error('❌ No bank details object found');
            return res.status(400).json({
                success: false,
                message: 'No bank details found. Please save your bank details first.'
            });
        }

        if (!driver.bankDetails.accountNumber) {
            console.error('❌ Account number missing');
            return res.status(400).json({
                success: false,
                message: 'Account number is missing. Please save your bank details first.'
            });
        }

        if (!driver.bankDetails.ifscCode) {
            console.error('❌ IFSC code missing');
            return res.status(400).json({
                success: false,
                message: 'IFSC code is missing. Please save your bank details first.'
            });
        }

        if (!driver.bankDetails.accountHolderName) {
            console.error('❌ Account holder name missing');
            return res.status(400).json({
                success: false,
                message: 'Account holder name is missing. Please save your bank details first.'
            });
        }

        console.log('✅ All bank details present, proceeding with verification...');

        const result = await bankVerificationService.verifyBankAccount(driver);

        if (!result.success) {
            return res.status(400).json(result);
        }

        console.log('✅ Bank details verified successfully');

        res.json({
            success: true,
            message: result.message,
            verificationStatus: result.status,
            verifiedAt: result.verifiedAt
        });
    } catch (error) {
        console.error('❌ Bank verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Bank verification failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getBankDetails,
    updateBankDetails,
    deleteBankDetails,
    verifyBankDetails
};
