/**
 * FRAUD DETECTION SERVICE
 * 
 * Implements risk-based monitoring for transactions.
 */

const Booking = require('../models/Booking');
const WalletTransaction = require('../models/WalletTransaction');

const calculateRiskScore = async (data) => {
    let riskScore = 0;
    const { userId, driverId, amount, bookingId, deviceId, currentGps } = data;

    // 1. Check for multiple failures from the same user recently
    const recentFailures = await WalletTransaction.countDocuments({
        user: userId,
        status: 'FAILED',
        createdAt: { $gte: new Date(Date.now() - 3600000) } // Last 1 hour
    });
    if (recentFailures >= 3) riskScore += 20;

    // 2. Device Mismatch check
    // If we track the last allowed deviceId on the user model, we can compare.
    // Assuming for now it's passed in.
    if (data.isNewDevice) riskScore += 15;

    // 3. GPS Mismatch (User location vs Ride Pickup)
    if (bookingId) {
        const booking = await Booking.findById(bookingId);
        if (booking && currentGps) {
            const dist = calculateDistance(
                currentGps.lat,
                currentGps.lon,
                booking.pickup.coordinates.latitude,
                booking.pickup.coordinates.longitude
            );
            if (dist > 2) riskScore += 30; // 2km deviation
        }
    }

    // 4. Amount Deviation
    // If the amount is significantly higher than usual for this user
    if (amount > 5000) riskScore += 25;

    return riskScore;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const evaluateRisk = async (score) => {
    if (score < 30) return { action: 'ALLOW', status: 'INITIATED' };
    if (score >= 30 && score <= 60) return { action: 'MANUAL_REVIEW', status: 'PROCESSING' };
    if (score > 60) return { action: 'BLOCK', status: 'FAILED' };
};

module.exports = {
    calculateRiskScore,
    evaluateRisk
};
