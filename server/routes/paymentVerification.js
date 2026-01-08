const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const phonePeService = require('../services/phonePeService');
const { authenticateToken } = require('../middleware/auth');

/**
 * VERIFY PAYMENT STATUS BEFORE RIDE COMPLETION
 * 
 * @route   POST /api/payment/verify-before-complete
 * @desc    Driver verifies payment was received before marking ride complete
 * @access  Private (Driver)
 */
router.post('/verify-before-complete', authenticateToken, async (req, res) => {
    try {
        const { bookingId } = req.body;

        console.log(`🔍 Verifying payment for booking: ${bookingId}`);

        // Get booking
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if driver owns this booking
        if (booking.driver.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // If payment method is CASH, no verification needed
        if (booking.payment.method === 'cash') {
            return res.json({
                success: true,
                verified: true,
                paymentMethod: 'cash',
                message: 'Cash payment - no verification needed',
                canComplete: true
            });
        }

        // For ONLINE payments (UPI/PhonePe/Card), verify with gateway
        console.log(`💳 Checking online payment status...`);
        console.log(`   Transaction ID: ${booking.payment.transactionId}`);

        // Check if payment status is already completed
        if (booking.payment.status === 'completed') {
            console.log(`✅ Payment already confirmed`);
            return res.json({
                success: true,
                verified: true,
                paymentMethod: booking.payment.method,
                paymentStatus: 'completed',
                amount: booking.payment.amount || booking.fare.total,
                message: 'Payment verified successfully',
                canComplete: true
            });
        }

        // Payment is pending - check with PhonePe
        if (!booking.payment.transactionId) {
            console.log(`❌ No transaction ID found`);
            return res.json({
                success: false,
                verified: false,
                paymentMethod: booking.payment.method,
                paymentStatus: 'not_initiated',
                message: 'Payment was not initiated by user',
                canComplete: false,
                suggestion: 'Please ask the user to pay via cash instead',
                action: 'SWITCH_TO_CASH'
            });
        }

        // Check payment status with PhonePe
        try {
            const paymentStatus = await phonePeService.checkStatus(booking.payment.transactionId);

            console.log(`📊 PhonePe Status Response:`, paymentStatus);

            // Check if payment is successful
            if (paymentStatus.code === 'PAYMENT_SUCCESS') {
                // Update booking payment status
                booking.payment.status = 'completed';
                booking.payment.details = paymentStatus.data;
                await booking.save();

                console.log(`✅ Payment verified and confirmed`);

                return res.json({
                    success: true,
                    verified: true,
                    paymentMethod: booking.payment.method,
                    paymentStatus: 'completed',
                    amount: paymentStatus.data.amount / 100, // Convert from paise
                    transactionId: paymentStatus.data.transactionId,
                    message: 'Payment verified successfully',
                    canComplete: true
                });
            }

            // Payment is pending or failed
            else if (paymentStatus.code === 'PAYMENT_PENDING') {
                console.log(`⏳ Payment is still pending`);

                return res.json({
                    success: false,
                    verified: false,
                    paymentMethod: booking.payment.method,
                    paymentStatus: 'pending',
                    message: 'Payment is still processing. Please wait or ask user to complete payment.',
                    canComplete: false,
                    suggestion: 'Wait for payment confirmation or switch to cash',
                    action: 'WAIT_OR_SWITCH_TO_CASH'
                });
            }

            // Payment failed
            else {
                console.log(`❌ Payment failed or cancelled`);

                return res.json({
                    success: false,
                    verified: false,
                    paymentMethod: booking.payment.method,
                    paymentStatus: 'failed',
                    message: 'User has not completed the payment',
                    canComplete: false,
                    suggestion: 'Please ask the user to pay via cash instead',
                    action: 'SWITCH_TO_CASH'
                });
            }

        } catch (statusError) {
            console.error(`❌ Error checking payment status:`, statusError.message);

            // If we can't verify, don't allow completion
            return res.json({
                success: false,
                verified: false,
                paymentMethod: booking.payment.method,
                paymentStatus: 'unknown',
                message: 'Unable to verify payment status',
                canComplete: false,
                suggestion: 'Please ask the user to pay via cash instead',
                action: 'SWITCH_TO_CASH',
                error: statusError.message
            });
        }

    } catch (error) {
        console.error('❌ Payment verification error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error verifying payment',
            error: error.message
        });
    }
});

/**
 * SWITCH PAYMENT METHOD TO CASH
 * 
 * @route   POST /api/payment/switch-to-cash
 * @desc    Switch payment method from online to cash
 * @access  Private (Driver)
 */
router.post('/switch-to-cash', authenticateToken, async (req, res) => {
    try {
        const { bookingId } = req.body;

        console.log(`🔄 Switching payment to cash for booking: ${bookingId}`);

        // Get booking
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Check if driver owns this booking
        if (booking.driver.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        // Check if ride is not yet completed
        if (booking.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Ride already completed'
            });
        }

        // Store old payment method for reference
        const oldPaymentMethod = booking.payment.method;
        const oldTransactionId = booking.payment.transactionId;

        // Switch to cash
        booking.payment = {
            method: 'cash',
            status: 'pending',
            transactionId: null,
            previousMethod: oldPaymentMethod,
            previousTransactionId: oldTransactionId,
            switchedAt: new Date(),
            switchedBy: req.user._id
        };

        await booking.save();

        console.log(`✅ Payment method switched from ${oldPaymentMethod} to cash`);

        // Notify user via socket
        try {
            const { getIO } = require('../socket');
            const io = getIO();
            if (io) {
                io.to(`user_${booking.user}`).emit('payment:method-changed', {
                    bookingId: booking._id,
                    newMethod: 'cash',
                    oldMethod: oldPaymentMethod,
                    message: 'Payment method changed to cash. Please pay the driver directly.'
                });
            }
        } catch (socketError) {
            console.log('⚠️ Socket notification failed:', socketError.message);
        }

        res.json({
            success: true,
            message: 'Payment method switched to cash',
            booking: {
                _id: booking._id,
                payment: booking.payment
            }
        });

    } catch (error) {
        console.error('❌ Switch to cash error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Error switching payment method',
            error: error.message
        });
    }
});

module.exports = router;
