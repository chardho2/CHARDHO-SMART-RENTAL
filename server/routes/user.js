const express = require('express');
const { authenticateToken, requireUser } = require('../middleware/auth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const router = express.Router();

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        // First check if user is in Driver collection
        const Driver = require('../models/Driver');
        const driver = await Driver.findById(req.user._id).select('-password');

        if (driver) {
            console.log('✅ Profile loaded from Driver collection:', driver.name);
            return res.json({
                success: true,
                user: driver
            });
        }

        // Fallback to User collection
        const user = await User.findById(req.user._id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log('✅ Profile loaded from User collection:', user.name);
        res.json({
            success: true,
            user: user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name, phone } = req.body;

        const updateData = {};
        if (name) updateData.name = name.trim();
        if (phone) updateData.phone = phone.trim();

        console.log('📝 Profile update request:', { userId: req.user._id, updateData });

        // First check if user is in Driver collection
        const Driver = require('../models/Driver');
        const driver = await Driver.findById(req.user._id);

        if (driver) {
            // Update driver profile
            const updatedDriver = await Driver.findByIdAndUpdate(
                req.user._id,
                { ...updateData, updatedAt: Date.now() },
                { new: true, runValidators: true }
            ).select('-password');

            console.log('✅ Driver profile updated:', updatedDriver.name);

            return res.json({
                success: true,
                message: 'Profile updated successfully',
                user: updatedDriver
            });
        }

        // Fallback to User collection
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { ...updateData, updatedAt: Date.now() },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log('✅ User profile updated:', user.name);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('❌ Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get user's ride history (placeholder)
router.get('/rides/history', authenticateToken, requireUser, async (req, res) => {
    try {
        // TODO: Implement ride history from rides collection
        res.json({
            success: true,
            rides: [],
            message: 'Ride history feature coming soon'
        });
    } catch (error) {
        console.error('Get ride history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get ride history',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete user account
router.delete('/account', authenticateToken, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.user._id);

        res.json({
            success: true,
            message: 'Account deleted successfully'
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete account',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   GET /api/user/wallet
// @desc    Get user wallet balance
// @access  Private
router.get('/wallet', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        res.json({
            success: true,
            wallet: {
                balance: user.walletBalance || 0,
                currency: '₹'
            }
        });
    } catch (error) {
        console.error('Get wallet error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get wallet balance'
        });
    }
});

// @route   POST /api/user/add-money
// @desc    Add money to wallet
// @access  Private
router.post('/add-money', authenticateToken, async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        const user = await User.findById(req.user._id);
        user.walletBalance = (user.walletBalance || 0) + parseFloat(amount);
        await user.save();

        // Create transaction record
        await Transaction.create({
            user: req.user._id,
            type: 'credit',
            amount: parseFloat(amount),
            description: 'Added money to wallet',
            status: 'completed',
            paymentMethod: 'system' // Placeholder for actual gateway
        });

        res.json({
            success: true,
            message: `₹${amount} added to wallet successfully`,
            wallet: {
                balance: user.walletBalance,
                currency: '₹'
            }
        });
    } catch (error) {
        console.error('Add money error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add money'
        });
    }
});

// @route   GET /api/user/transactions
// @desc    Get user transaction history
// @access  Private
router.get('/transactions', authenticateToken, async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(20);

        res.json({
            success: true,
            transactions
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get transactions'
        });
    }
});

// @route   PUT /api/user/status
// @desc    Update online/offline status (for drivers)
// @access  Private
router.put('/status', authenticateToken, async (req, res) => {
    try {
        const { isOnline, location } = req.body;

        console.log('📊 Status update request:', {
            userId: req.user._id,
            requestedStatus: isOnline,
            hasLocation: !!location,
            userRole: req.user.role,
            userType: req.user.userType
        });

        // First, try to find in Driver collection
        const Driver = require('../models/Driver');
        let driver = await Driver.findById(req.user._id);

        if (driver) {
            // User is a driver in the Driver collection
            console.log('✅ Found driver in Driver collection:', driver.name);

            driver.isOnline = isOnline;
            driver.isActive = true; // Ensure driver is active

            // Update location if provided
            if (location && location.latitude && location.longitude) {
                driver.location = {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    lastUpdated: new Date()
                };
                console.log(`📍 Updated driver location: ${location.latitude}, ${location.longitude}`);
            } else if (isOnline && driver.location) {
                // Just update timestamp if going online without new location (fallback)
                driver.location.lastUpdated = new Date();
            }

            await driver.save();

            console.log(`✅ Driver ${driver.name} is now ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

            // Broadcast status via socket
            try {
                const { broadcastDriverStatus } = require('../socket');
                broadcastDriverStatus(
                    req.user._id.toString(),
                    isOnline ? 'online' : 'offline',
                    driver.location
                );
            } catch (socketError) {
                console.error('Socket broadcast error:', socketError);
            }

            return res.json({
                success: true,
                message: `You are now ${isOnline ? 'online' : 'offline'}`,
                isOnline: driver.isOnline,
                driver: {
                    name: driver.name,
                    isOnline: driver.isOnline,
                    isActive: driver.isActive
                }
            });
        }

        // If not found in Driver collection, check User collection (legacy support)
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is a driver (check both role and userType for compatibility)
        if (user.role !== 'driver' && user.userType !== 'driver') {
            return res.status(403).json({
                success: false,
                message: 'Only drivers can update online status. Please register as a driver first.'
            });
        }

        console.log('⚠️ Found driver in User collection (legacy):', user.name);
        console.log('   Consider migrating to Driver collection');

        // Update online status in User collection
        user.isOnline = isOnline;

        // Sync role and userType if they don't match
        if (user.role !== user.userType) {
            user.role = user.userType;
        }

        // Update location if provided (legacy user model might vary but adding it anyway if schema supports)
        if (location && location.latitude && location.longitude) {
            // Check if User schema supports location in this format, assuming similar to Driver for now or creating simplified version
            if (!user.location) user.location = {};
            user.location.latitude = location.latitude;
            user.location.longitude = location.longitude;
            user.location.lastUpdated = new Date();
        }

        await user.save();

        console.log(`✅ User ${user.name} is now ${isOnline ? 'ONLINE' : 'OFFLINE'}`);

        // Broadcast status via socket
        try {
            const { broadcastDriverStatus } = require('../socket');
            broadcastDriverStatus(
                req.user._id.toString(),
                isOnline ? 'online' : 'offline',
                user.location
            );
        } catch (socketError) {
            console.error('Socket broadcast error:', socketError);
        }

        res.json({
            success: true,
            message: `You are now ${isOnline ? 'online' : 'offline'}`,
            isOnline: user.isOnline
        });
    } catch (error) {
        console.error('❌ Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// @route   PUT /api/user/vehicle
// @desc    Update vehicle information (for drivers)
// @access  Private
router.put('/vehicle', authenticateToken, async (req, res) => {
    try {
        const { type, model, plateNumber, color, year } = req.body;

        const updateData = {};
        if (type) updateData['vehicle.type'] = type;
        if (model) updateData['vehicle.model'] = model;
        if (plateNumber) updateData['vehicle.plateNumber'] = plateNumber;
        if (color) updateData['vehicle.color'] = color;
        if (year) updateData['vehicle.year'] = year;

        // First check Driver collection
        const Driver = require('../models/Driver');
        const driver = await Driver.findById(req.user._id);

        if (driver) {
            Object.assign(driver, {
                vehicle: {
                    ...driver.vehicle,
                    ...req.body, // Simple merge for now, or selective update
                }
            });
            // Manual field update is safer to preserve existing subfields
            if (type) driver.vehicle.type = type;
            if (model) driver.vehicle.model = model;
            if (plateNumber) driver.vehicle.plateNumber = plateNumber;
            if (color) driver.vehicle.color = color;
            if (year) driver.vehicle.year = year;

            await driver.save();

            return res.json({
                success: true,
                message: 'Vehicle information updated successfully',
                vehicle: driver.vehicle
            });
        }

        // Fallback to User collection
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (user.role !== 'driver' && user.userType !== 'driver') {
            return res.status(403).json({
                success: false,
                message: 'Only drivers can update vehicle information'
            });
        }

        if (type) user.vehicle.type = type;
        if (model) user.vehicle.model = model;
        if (plateNumber) user.vehicle.plateNumber = plateNumber;
        if (color) user.vehicle.color = color;
        if (year) user.vehicle.year = year;

        await user.save();

        res.json({
            success: true,
            message: 'Vehicle information updated successfully',
            vehicle: user.vehicle
        });
    } catch (error) {
        console.error('Update vehicle error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update vehicle information'
        });
    }
});

// @route   GET /api/user/emergency-contacts
// @desc    Get emergency contacts
// @access  Private
router.get('/emergency-contacts', authenticateToken, async (req, res) => {
    try {
        let user;
        const Driver = require('../models/Driver');
        const driver = await Driver.findById(req.user._id);

        if (driver) {
            user = driver;
        } else {
            user = await User.findById(req.user._id);
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            contacts: user.emergencyContacts || []
        });
    } catch (error) {
        console.error('Get emergency contacts error:', error);
        res.status(500).json({ success: false, message: 'Failed to get contacts' });
    }
});

// @route   POST /api/user/emergency-contacts
// @desc    Add emergency contact
// @access  Private
router.post('/emergency-contacts', authenticateToken, async (req, res) => {
    try {
        const { name, number, relation } = req.body;

        if (!name || !number || !relation) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        let user;
        const Driver = require('../models/Driver');
        const driver = await Driver.findById(req.user._id);

        if (driver) {
            driver.emergencyContacts.push({ name, number, relation });
            await driver.save();
            user = driver;
        } else {
            user = await User.findById(req.user._id);
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });

            user.emergencyContacts.push({ name, number, relation });
            await user.save();
        }

        res.json({
            success: true,
            message: 'Emergency contact added',
            contacts: user.emergencyContacts
        });
    } catch (error) {
        console.error('Add emergency contact error:', error);
        res.status(500).json({ success: false, message: 'Failed to add contact' });
    }
});

// @route   DELETE /api/user/emergency-contacts/:id
// @desc    Delete emergency contact
// @access  Private
router.delete('/emergency-contacts/:id', authenticateToken, async (req, res) => {
    try {
        const contactId = req.params.id;

        let user;
        const Driver = require('../models/Driver');
        const driver = await Driver.findById(req.user._id);

        if (driver) {
            driver.emergencyContacts = driver.emergencyContacts.filter(c => c._id.toString() !== contactId);
            await driver.save();
            user = driver;
        } else {
            user = await User.findById(req.user._id);
            if (!user) return res.status(404).json({ success: false, message: 'User not found' });

            user.emergencyContacts = user.emergencyContacts.filter(c => c._id.toString() !== contactId);
            await user.save();
        }

        res.json({
            success: true,
            message: 'Contact deleted',
            contacts: user.emergencyContacts
        });
    } catch (error) {
        console.error('Delete emergency contact error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete contact' });
    }
});

module.exports = router;
