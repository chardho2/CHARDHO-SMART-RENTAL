const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const User = require('../models/User');
const phonePeService = require('../services/phonePeService');
const payoutService = require('../services/payoutService');
const { authenticateToken } = require('../middleware/auth');

/**
 * CREATE PAYMENT
 * @route   POST /api/payment/create
 * @desc    Initiate PhonePe Payment for a Booking
 * @access  Private (User)
 */
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const { bookingId, amount } = req.body;

        // Validate booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Get user details
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Initiate payment via PhonePe
        const paymentAmount = amount || booking.fare.total;
        const response = await phonePeService.initiatePayment({
            amount: paymentAmount,
            userId: req.user._id.toString(),
            bookingId: bookingId,
            userPhone: user.phone || "9999999999"
        });

        // Update booking with transaction details
        if (response.success) {
            booking.payment = {
                method: 'phonepe',
                status: 'pending',
                transactionId: response.merchantTransactionId,
                amount: paymentAmount
            };
            await booking.save();

            console.log(`💸 Payment initiated: ${response.merchantTransactionId} for ₹${paymentAmount}`);
        }

        // Return redirect URL to frontend
        res.json({
            success: true,
            transactionId: response.merchantTransactionId,
            redirectUrl: response.data?.instrumentResponse?.redirectInfo?.url,
            data: response.data
        });

    } catch (error) {
        console.error('❌ Payment Creation Error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * CALLBACK FROM PHONEPE
 * @route   POST /api/payment/callback
 * @desc    PhonePe Server-to-Server Callback (Webhook)
 * @access  Public (Called by PhonePe)
 */
router.post('/callback', async (req, res) => {
    try {
        const receivedChecksum = req.headers['x-verify'];
        const encodedResponse = req.body.response;

        // Validate payload
        if (!encodedResponse || !receivedChecksum) {
            console.error('❌ Invalid callback payload');
            return res.status(400).send('Invalid payload');
        }

        // Verify checksum
        if (!phonePeService.verifyCallback(encodedResponse, receivedChecksum)) {
            console.error('❌ Checksum mismatch - possible tampering');
            return res.status(400).send('Checksum mismatch');
        }

        // Decode response
        const decoded = JSON.parse(
            Buffer.from(encodedResponse, 'base64').toString('utf8')
        );

        console.log('📥 PhonePe Callback:', decoded.code, decoded.merchantTransactionId);

        // Handle successful payment
        if (decoded.code === 'PAYMENT_SUCCESS') {
            const merchantTransactionId = decoded.data.merchantTransactionId;

            // Extract bookingId from transaction ID (Format: TXN_BookingId_Timestamp)
            const parts = merchantTransactionId.split('_');
            const bookingId = parts[1];

            const booking = await Booking.findById(bookingId);

            if (booking) {
                // Prevent duplicate processing
                if (booking.payment?.status === 'completed') {
                    console.log('⚠️ Payment already processed:', merchantTransactionId);
                    return res.sendStatus(200);
                }

                // Update payment status
                booking.payment = {
                    method: 'phonepe',
                    status: 'completed',
                    transactionId: decoded.data.transactionId,
                    merchantTransactionId: merchantTransactionId,
                    amount: decoded.data.amount / 100, // Convert from paise to rupees
                    details: decoded.data
                };
                await booking.save();

                // Process 70/30 split and credit driver wallet (NEW WALLET SYSTEM V2)
                const walletServiceV2 = require('../services/walletServiceV2');

                // Calculate earnings split
                const commission = Math.round(booking.fare.total * 0.30); // 30%
                const driverEarnings = Math.round(booking.fare.total - commission); // 70%

                // Process online payment through wallet service V2
                await walletServiceV2.processRideEarning({
                    driverId: booking.driver,
                    userId: booking.user,
                    bookingId: booking._id,
                    totalFare: booking.fare.total,
                    commission: commission,
                    driverEarning: driverEarnings,
                    paymentMethod: 'PHONEPE',
                    gatewayTransactionId: decoded.data.transactionId
                });

                console.log(`✅ Payment SUCCESS: Booking ${bookingId}, Amount ₹${booking.payment.amount}`);

                // Notify driver via socket
                try {
                    const { getIO } = require('../socket');
                    const io = getIO();
                    if (io) {
                        io.to(`driver_${booking.driver}`).emit('payment:received', {
                            bookingId: booking._id,
                            amount: booking.payment.amount
                        });
                    }
                } catch (e) {
                    console.log('⚠️ Socket notification failed');
                }
            } else {
                console.error('❌ Booking not found:', bookingId);
            }
        } else {
            console.log(`❌ Payment FAILED/PENDING: ${decoded.code}`, decoded.merchantTransactionId);
        }

        // Always respond 200 to PhonePe
        res.sendStatus(200);

    } catch (error) {
        console.error('❌ Callback processing error:', error.message);
        res.status(500).send('Callback error');
    }
});

/**
 * CHECK PAYMENT STATUS
 * @route   GET /api/payment/status/:transactionId
 * @desc    Check payment status manually (for polling from frontend)
 * @access  Public
 */
router.get('/status/:transactionId', async (req, res) => {
    try {
        const { transactionId } = req.params;

        console.log(`🔍 Checking status: ${transactionId}`);

        const response = await phonePeService.checkStatus(transactionId);

        res.json({
            success: true,
            data: response
        });

    } catch (error) {
        console.error('❌ Status check error:', error.message);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * LEGACY ROUTE - Redirect to /create
 * @route   POST /api/payment/initiate
 */
router.post('/initiate', authenticateToken, async (req, res) => {
    // Redirect to new endpoint
    req.url = '/create';
    router.handle(req, res);
});

module.exports = router;
