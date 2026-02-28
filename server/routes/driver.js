const express = require('express');
const { authenticateToken, requireDriver } = require('../middleware/auth');
const Driver = require('../models/Driver');
const Notification = require('../models/Notification');

const router = express.Router();

// Get driver profile
router.get('/profile', authenticateToken, requireDriver, async (req, res) => {
    try {
        res.json({
            success: true,
            driver: req.user
        });
    } catch (error) {
        console.error('Get driver profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get driver profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update driver profile (including vehicle info)
router.put('/profile', authenticateToken, requireDriver, async (req, res) => {
    try {
        console.log('🔄 Update Profile Request:', req.body);
        const { name, email, phone, vehicle, documents, bankDetails } = req.body;

        const updateData = {};

        // Update basic profile fields
        if (name) updateData.name = name.trim();
        if (email) updateData.email = email.trim();
        if (phone) updateData.phone = phone.trim();

        // Update vehicle information
        if (vehicle) {
            updateData.vehicle = {
                type: vehicle.type || 'bike',
                model: vehicle.model?.trim() || '',
                plateNumber: vehicle.plateNumber?.trim() || '',
                color: vehicle.color?.trim() || '',
                year: vehicle.year || new Date().getFullYear()
            };
        }

        // Update documents using dot notation for safer nested updates
        if (documents) {
            if (documents.license !== undefined) updateData['documents.license'] = documents.license;
            if (documents.aadhar !== undefined) updateData['documents.aadhar'] = documents.aadhar;
            if (documents.vehicleRC !== undefined) updateData['documents.vehicleRC'] = documents.vehicleRC;

            // Auto-verify if all documents are present
            const hasLicense = documents.license && documents.license.length > 0;
            const hasAadhar = documents.aadhar && documents.aadhar.length > 0;
            const hasRC = documents.vehicleRC && documents.vehicleRC.length > 0;

            if (hasLicense && hasAadhar && hasRC) {
                updateData.isVerified = true;

                // Notify if newly verified
                if (!req.user.isVerified) {
                    try {
                        const { getIO } = require('../socket');
                        const NotificationService = require('../services/notificationService');
                        const io = getIO();
                        if (io) {
                            // Using a slight delay or just await to ensure it doesn't block critical path too much
                            // But usually await is fine.
                            await NotificationService.notifyDocumentVerification(io, req.user._id, true, 'Document Set');
                        }
                    } catch (e) {
                        console.error('Failed to send verification notification:', e);
                    }
                }
            }
        }

        // Update bank details
        if (bankDetails) {
            updateData.bankDetails = {
                accountNumber: bankDetails.accountNumber || '',
                ifscCode: bankDetails.ifscCode || '',
                accountHolderName: bankDetails.accountHolderName || ''
            };
        }

        const driver = await Driver.findByIdAndUpdate(
            req.user._id,
            { ...updateData, updatedAt: Date.now() },
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'Driver profile updated successfully',
            driver
        });
    } catch (error) {
        console.error('Update driver profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update driver profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update driver status
router.put('/status', authenticateToken, requireDriver, async (req, res) => {
    try {
        const { status } = req.body;
        if (!['online', 'offline'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const driver = await Driver.findByIdAndUpdate(
            req.user._id,
            {
                isOnline: status === 'online',
                updatedAt: Date.now()
            },
            { new: true }
        );

        res.json({
            success: true,
            message: `Driver is now ${status}`,
            isOnline: driver.isOnline
        });
    } catch (error) {
        console.error('Update driver status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get driver's ride history (placeholder)
router.get('/rides/history', authenticateToken, requireDriver, async (req, res) => {
    try {
        // TODO: Implement driver ride history from rides collection
        res.json({
            success: true,
            rides: [],
            message: 'Driver ride history feature coming soon'
        });
    } catch (error) {
        console.error('Get driver ride history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get ride history',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// LEGACY STATS - Use /wallet/stats
// router.get('/stats', authenticateToken, requireDriver, async (req, res) => { ... });

// LEGACY TRANSACTIONS - Use /wallet/transactions
// router.get('/transactions', authenticateToken, requireDriver, async (req, res) => { ... });

// Bank Details Controller
const {
    getBankDetails,
    updateBankDetails,
    deleteBankDetails,
    verifyBankDetails
} = require('../controllers/bankDetailsController');

// Payout Controller
const { getFinancialSummary } = require('../controllers/payoutController');

// Wallet Controller
const {
    getWalletBalance,
    getWalletDetails,
    getTransactionHistory,
    getWalletStats,
    requestWithdrawal
} = require('../controllers/walletController');

// Get bank details
router.get('/bank-details', authenticateToken, requireDriver, getBankDetails);

// Update bank details
router.put('/bank-details', authenticateToken, requireDriver, updateBankDetails);

// Delete bank details
router.delete('/bank-details', authenticateToken, requireDriver, deleteBankDetails);

// Verify bank details
router.post('/bank-details/verify', authenticateToken, requireDriver, verifyBankDetails);

// Get driver financial summary (Earnings, Payouts, Balance)
router.get('/financial/summary', authenticateToken, requireDriver, getFinancialSummary);

// Wallet routes
router.get('/wallet/balance', authenticateToken, requireDriver, getWalletBalance);
router.get('/wallet', authenticateToken, requireDriver, getWalletDetails);
router.get('/wallet/transactions', authenticateToken, requireDriver, getTransactionHistory);
router.get('/wallet/stats', authenticateToken, requireDriver, getWalletStats);
router.post('/wallet/withdraw', authenticateToken, requireDriver, requestWithdrawal);

// Get notifications
router.get('/notifications', authenticateToken, requireDriver, async (req, res) => {
    try {
        const Notification = require('../models/Notification');
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            notifications
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get notifications'
        });
    }
});

module.exports = router;
