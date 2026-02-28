const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// @route   GET /api/debug/drivers
// @desc    Debug endpoint to check driver status
// @access  Private
router.get('/drivers', authenticateToken, async (req, res) => {
    try {
        console.log('🔍 DEBUG: Checking all drivers in database...');

        // Get all users with driver role or userType
        const allDrivers = await User.find({
            $or: [
                { role: 'driver' },
                { userType: 'driver' }
            ]
        }).select('name email role userType isOnline isAvailable vehicle');

        console.log(`📊 Total drivers found: ${allDrivers.length}`);

        // Get online drivers
        const onlineDrivers = await User.find({
            $or: [
                { role: 'driver' },
                { userType: 'driver' }
            ],
            isOnline: true
        }).select('name email role userType isOnline vehicle');

        console.log(`✅ Online drivers: ${onlineDrivers.length}`);

        // Format response
        const driverDetails = allDrivers.map(driver => ({
            name: driver.name,
            email: driver.email,
            role: driver.role,
            userType: driver.userType,
            isOnline: driver.isOnline,
            isAvailable: driver.isAvailable,
            vehicle: {
                type: driver.vehicle?.type || null,
                model: driver.vehicle?.model || null,
                plateNumber: driver.vehicle?.plateNumber || null
            },
            issues: []
        }));

        // Check for issues
        driverDetails.forEach(driver => {
            if (!driver.isOnline) {
                driver.issues.push('Driver is OFFLINE - Toggle online in dashboard');
            }
            if (!driver.vehicle.type) {
                driver.issues.push('Vehicle type NOT SET - Update vehicle info');
            }
            if (driver.role !== 'driver' && driver.userType !== 'driver') {
                driver.issues.push('Neither role nor userType is "driver"');
            }
        });

        // Test the actual query used in booking
        const { latitude = 17.7, longitude = 83.3, rideType } = req.query;

        const bookingQuery = {
            $or: [
                { role: 'driver' },
                { userType: 'driver' }
            ],
            isOnline: true
        };

        if (rideType && rideType !== 'all') {
            bookingQuery['vehicle.type'] = rideType;
        }

        console.log('🔍 Testing booking query:', JSON.stringify(bookingQuery, null, 2));

        const availableForBooking = await User.find(bookingQuery)
            .select('name email vehicle isOnline');

        console.log(`📤 Drivers that would show in booking: ${availableForBooking.length}`);

        res.json({
            success: true,
            summary: {
                totalDrivers: allDrivers.length,
                onlineDrivers: onlineDrivers.length,
                availableForBooking: availableForBooking.length,
                testQuery: bookingQuery
            },
            drivers: driverDetails,
            availableDriversForBooking: availableForBooking.map(d => ({
                name: d.name,
                email: d.email,
                vehicleType: d.vehicle?.type,
                isOnline: d.isOnline
            }))
        });

    } catch (error) {
        console.error('Debug drivers error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// @route   PUT /api/debug/driver/:email/online
// @desc    Force set driver online status
// @access  Private
router.put('/driver/:email/online', authenticateToken, async (req, res) => {
    try {
        const { email } = req.params;
        const { isOnline } = req.body;

        const driver = await User.findOne({ email });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        driver.isOnline = isOnline;
        await driver.save();

        console.log(`✅ Set ${email} online status to: ${isOnline}`);

        res.json({
            success: true,
            message: `Driver ${isOnline ? 'online' : 'offline'}`,
            driver: {
                name: driver.name,
                email: driver.email,
                isOnline: driver.isOnline
            }
        });
    } catch (error) {
        console.error('Set online error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   PUT /api/debug/driver/:email/vehicle
// @desc    Set driver vehicle info
// @access  Private
router.put('/driver/:email/vehicle', authenticateToken, async (req, res) => {
    try {
        const { email } = req.params;
        const { type, model, plateNumber } = req.body;

        const driver = await User.findOne({ email });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        if (!driver.vehicle) {
            driver.vehicle = {};
        }

        if (type) driver.vehicle.type = type;
        if (model) driver.vehicle.model = model;
        if (plateNumber) driver.vehicle.plateNumber = plateNumber;

        await driver.save();

        console.log(`✅ Updated vehicle for ${email}:`, driver.vehicle);

        res.json({
            success: true,
            message: 'Vehicle info updated',
            driver: {
                name: driver.name,
                email: driver.email,
                vehicle: driver.vehicle
            }
        });
    } catch (error) {
        console.error('Set vehicle error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
