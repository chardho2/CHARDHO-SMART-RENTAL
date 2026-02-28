const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

/**
 * PAYMENT VALIDATION SERVICE
 * Handles payment verification and fraud prevention
 */

/**
 * Validate a payment before crediting
 * @param {Object} paymentData - Payment information
 * @param {Object} booking - Booking document
 * @returns {Object} - Validation result
 */
const validatePayment = async (paymentData, booking) => {
    const {
        amount,
        method,
        gatewayTransactionId,
        metadata = {}
    } = paymentData;

    // Generate unique payment ID
    const paymentId = Payment.generatePaymentId();

    // Create payment record
    const payment = new Payment({
        paymentId,
        booking: booking._id,
        amount,
        method,
        gatewayTransactionId,
        gatewayName: method === 'cash' ? 'none' : (metadata.gatewayName || 'razorpay'),
        metadata
    });

    const validationResults = {
        passed: true,
        payment,
        errors: [],
        warnings: []
    };

    // 1. Check uniqueness (prevent duplicate payments for same booking)
    const existingPayment = await Payment.findOne({
        booking: booking._id,
        status: { $in: ['verified', 'pending'] }
    });

    if (existingPayment) {
        payment.addValidationCheck('duplicate_check', false, 'Payment already exists for this booking');
        validationResults.passed = false;
        validationResults.errors.push('Duplicate payment detected');
    } else {
        payment.addValidationCheck('duplicate_check', true);
    }

    // 2. Validate amount matches booking fare
    const expectedAmount = booking.fare.total;
    const amountMatch = Math.abs(amount - expectedAmount) < 1; // Allow 1 rupee difference for rounding

    if (!amountMatch) {
        payment.addValidationCheck('amount_match', false, `Expected: ${expectedAmount}, Got: ${amount}`);
        validationResults.passed = false;
        validationResults.errors.push(`Amount mismatch: expected ₹${expectedAmount}, got ₹${amount}`);
    } else {
        payment.addValidationCheck('amount_match', true);
    }

    // 3. Verify gateway transaction (for digital payments)
    if (method !== 'cash') {
        if (!gatewayTransactionId) {
            payment.addValidationCheck('gateway_verification', false, 'Missing gateway transaction ID');
            validationResults.passed = false;
            validationResults.errors.push('Gateway transaction ID required for digital payments');
        } else {
            // TODO: Integrate with actual payment gateway API to verify transaction
            // For now, we'll mark as passed if ID is provided
            payment.addValidationCheck('gateway_verification', true, 'Gateway ID provided (pending API verification)');
            validationResults.warnings.push('Gateway verification pending - integrate payment gateway API');
        }
    } else {
        payment.addValidationCheck('gateway_verification', true, 'Cash payment - no gateway verification needed');
    }

    // 4. Geolocation validation (if location data provided)
    if (metadata.location) {
        const { latitude, longitude } = metadata.location;
        const dropLocation = booking.drop.coordinates;

        // Calculate distance between payment location and drop location
        const distance = calculateDistance(
            latitude,
            longitude,
            dropLocation[1],
            dropLocation[0]
        );

        // Payment should be made within 5km of drop location
        if (distance > 5) {
            payment.addValidationCheck('geolocation', false, `Payment location ${distance.toFixed(2)}km from drop-off`);
            validationResults.warnings.push(`Payment made ${distance.toFixed(2)}km from drop location`);
        } else {
            payment.addValidationCheck('geolocation', true);
        }
    }

    // 5. Calculate fraud score
    const fraudScore = payment.calculateFraudScore();

    if (fraudScore >= 70) {
        validationResults.passed = false;
        validationResults.errors.push(`High fraud risk (score: ${fraudScore})`);
    } else if (fraudScore >= 50) {
        validationResults.warnings.push(`Moderate fraud risk (score: ${fraudScore})`);
    }

    payment.addValidationCheck('fraud_score', fraudScore < 70, `Fraud score: ${fraudScore}`);

    // Save payment record
    await payment.save();

    return {
        ...validationResults,
        payment,
        fraudScore
    };
};

/**
 * Verify payment with gateway (placeholder for actual integration)
 * @param {String} gatewayTransactionId - Gateway transaction ID
 * @param {String} gatewayName - Payment gateway name
 * @returns {Object} - Verification result
 */
const verifyWithGateway = async (gatewayTransactionId, gatewayName) => {
    // TODO: Integrate with actual payment gateway APIs
    // Razorpay: https://razorpay.com/docs/api/payments/
    // Paytm: https://developer.paytm.com/docs/
    // PhonePe: https://developer.phonepe.com/docs/

    console.log(`🔍 Verifying payment ${gatewayTransactionId} with ${gatewayName}`);

    // Placeholder response
    return {
        verified: true,
        amount: 0,
        status: 'success',
        message: 'Gateway verification pending - integrate payment gateway API'
    };
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {Number} lat1 - Latitude 1
 * @param {Number} lon1 - Longitude 1
 * @param {Number} lat2 - Latitude 2
 * @param {Number} lon2 - Longitude 2
 * @returns {Number} - Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Get payment by ID
 * @param {String} paymentId - Payment ID
 * @returns {Object} - Payment document
 */
const getPayment = async (paymentId) => {
    return await Payment.findOne({ paymentId }).populate('booking');
};

/**
 * Get payments for a booking
 * @param {String} bookingId - Booking ID
 * @returns {Array} - Payment documents
 */
const getPaymentsByBooking = async (bookingId) => {
    return await Payment.find({ booking: bookingId }).sort({ createdAt: -1 });
};

/**
 * Flag payment for review
 * @param {String} paymentId - Payment ID
 * @param {String} reason - Flag reason
 * @returns {Object} - Updated payment
 */
const flagPayment = async (paymentId, reason) => {
    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
        throw new Error('Payment not found');
    }

    payment.flagged = true;
    payment.flagReason = reason;
    payment.status = 'disputed';

    await payment.save();
    return payment;
};

/**
 * Approve flagged payment (admin action)
 * @param {String} paymentId - Payment ID
 * @param {String} adminId - Admin user ID
 * @param {String} notes - Review notes
 * @returns {Object} - Updated payment
 */
const approvePayment = async (paymentId, adminId, notes = '') => {
    const payment = await Payment.findOne({ paymentId });

    if (!payment) {
        throw new Error('Payment not found');
    }

    payment.markAsVerified();
    payment.reviewedBy = adminId;
    payment.reviewedAt = new Date();
    payment.reviewNotes = notes;

    await payment.save();
    return payment;
};

module.exports = {
    validatePayment,
    verifyWithGateway,
    getPayment,
    getPaymentsByBooking,
    flagPayment,
    approvePayment,
    calculateDistance
};
