const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { authenticateToken } = require('../middleware/auth');

// @route   GET /api/stats/user
// @desc    Get user statistics
// @access  Private
router.get('/user', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get total bookings
        const totalBookings = await Booking.countDocuments({ user: userId });

        // Get completed rides
        const completedRides = await Booking.countDocuments({
            user: userId,
            status: 'completed'
        });

        // Get cancelled rides
        const cancelledRides = await Booking.countDocuments({
            user: userId,
            status: 'cancelled'
        });

        // Get total spent
        const completedBookings = await Booking.find({
            user: userId,
            status: 'completed'
        });
        const totalSpent = completedBookings.reduce((sum, booking) => sum + (booking.fare?.total || 0), 0);

        // Get average rating given by user
        const ratedBookings = await Booking.find({
            user: userId,
            rating: { $exists: true, $ne: null, $gte: 1 }
        });
        const avgRatingGiven = ratedBookings.length > 0
            ? ratedBookings.reduce((sum, b) => sum + (b.rating || 0), 0) / ratedBookings.length
            : 0;

        // Get favorite ride type
        const rideTypes = {};
        completedBookings.forEach(booking => {
            const typeId = booking.rideType?.id || 'bike';
            rideTypes[typeId] = (rideTypes[typeId] || 0) + 1;
        });
        const favoriteRideType = Object.keys(rideTypes).length > 0
            ? Object.keys(rideTypes).reduce((a, b) => rideTypes[a] > rideTypes[b] ? a : b)
            : 'bike';

        // Get savings (mock calculation - 10% of total spent)
        const totalSavings = Math.round(totalSpent * 0.1);

        res.json({
            success: true,
            stats: {
                totalBookings,
                completedRides,
                cancelledRides,
                totalSpent: Math.round(totalSpent),
                totalSavings,
                avgRatingGiven: Math.round(avgRatingGiven * 10) / 10,
                favoriteRideType,
                memberSince: req.user.createdAt
            }
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// @route   GET /api/stats/driver
// @desc    Get driver statistics
// @access  Private (Driver only)
router.get('/driver', authenticateToken, async (req, res) => {
    try {
        const driverId = req.user.id;

        // Check if user is a driver
        if (req.user.role !== 'driver') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Driver privileges required.'
            });
        }

        // Get total rides
        const totalRides = await Booking.countDocuments({ driver: driverId });

        // Get completed rides
        const completedRides = await Booking.countDocuments({
            driver: driverId,
            status: 'completed'
        });

        // Get total earnings
        const completedBookings = await Booking.find({
            driver: driverId,
            status: 'completed'
        });
        const totalEarnings = completedBookings.reduce((sum, booking) => sum + (booking.fare?.total || 0), 0);

        // Get average rating from bookings
        const ratedBookings = await Booking.find({
            driver: driverId,
            rating: { $exists: true, $ne: null, $gte: 1 }
        });

        console.log(`📊 Driver ${driverId} has ${ratedBookings.length} rated bookings`);

        const avgRating = ratedBookings.length > 0
            ? ratedBookings.reduce((sum, b) => sum + (b.rating || 0), 0) / ratedBookings.length
            : 0;

        console.log(`📊 Calculated average rating: ${avgRating} from ${ratedBookings.length} bookings`);

        // Get today's earnings
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayBookings = await Booking.find({
            driver: driverId,
            status: 'completed',
            createdAt: { $gte: today }
        });
        const todayEarnings = todayBookings.reduce((sum, booking) => sum + (booking.fare?.total || 0), 0);

        // Get this week's rides
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekRides = await Booking.countDocuments({
            driver: driverId,
            status: 'completed',
            createdAt: { $gte: weekAgo }
        });

        const todayRides = todayBookings.length;

        const statsResponse = {
            totalRides,
            completedRides,
            totalEarnings: Math.round(totalEarnings),
            todayEarnings: Math.round(todayEarnings),
            todayRides,
            weekRides,
            avgRating: Math.round(avgRating * 10) / 10,
            memberSince: req.user.createdAt
        };

        console.log('📊 Sending stats response:', statsResponse);

        res.json({
            success: true,
            stats: statsResponse
        });
    } catch (error) {
        console.error('Get driver stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
