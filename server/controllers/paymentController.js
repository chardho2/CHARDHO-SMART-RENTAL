const razorpayService = require('../services/razorpayService');
const walletService = require('../services/walletServiceV2'); // Using V2 for ledger
const qrService = require('../services/qrService');
const Driver = require('../models/Driver');
const Booking = require('../models/Booking');
const WalletTransaction = require('../models/WalletTransaction');

/**
 * PAYMENT CONTROLLER
 */

const fraudService = require('../services/fraudService');

/**
 * 1. Generate Order (Pre-payment)
 * Called when user scans QR and enters amount, or finishes a ride
 */
const createOrder = async (req, res) => {
    try {
        const { amount, bookingId, driverId, currentGps, deviceId } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }

        // 1. RISK ASSESSMENT (Fraud Detection)
        const riskScore = await fraudService.calculateRiskScore({
            userId: req.user?._id,
            driverId,
            amount,
            bookingId,
            currentGps,
            deviceId
        });

        const riskAction = await fraudService.evaluateRisk(riskScore);

        if (riskAction.action === 'BLOCK') {
            console.warn(`🛑 PAYMENT BLOCKED: Risk Score ${riskScore} for User ${req.user?._id}`);
            return res.status(403).json({
                success: false,
                message: 'Transaction flagged by security. Please contact support.',
                riskScore
            });
        }

        // Internal Reference ID (Booking ID or Timestamp if tipping/custom pay)
        const referenceId = bookingId || `qh_${Date.now()}`;

        // 2. LOG TRANSACTION AS INITIATED (Backend as Source of Truth)
        // We'll update the booking if it exists
        if (bookingId) {
            await Booking.findByIdAndUpdate(bookingId, {
                'payment.status': 'processing',
                'payment.riskScore': riskScore
            });
        }

        const order = await razorpayService.createOrder(amount, referenceId, {
            driverId,
            bookingId,
            userId: req.user ? req.user._id : 'guest',
            riskScore
        });

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID,
            riskStatus: riskAction.action
        });

    } catch (error) {
        console.error('Create Order Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create payment order' });
    }
};

/**
 * 2. Razorpay Webhook Handler
 * Single source of truth for payment success
 */
const handleWebhook = async (req, res) => {
    try {
        // Validate signature
        const signature = req.headers['x-razorpay-signature'];
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!razorpayService.verifyWebhookSignature(req.rawBody, signature, secret)) {
            console.error('❌ Invalid Webhook Signature');
            return res.status(400).json({ status: 'failure' });
        }

        const event = req.body.event;
        const payload = req.body.payload;

        if (event === 'payment.captured') {
            const payment = payload.payment.entity;
            const notes = payment.notes;

            const amount = payment.amount / 100; // Paise to INR
            const driverId = notes.driverId;
            const bookingId = notes.bookingId;
            const gatewayTxnId = payment.id;

            // 1. IDEMPOTENCY CHECK
            const existingTxn = await WalletTransaction.findOne({ gatewayTransactionId: gatewayTxnId });
            if (existingTxn) {
                console.log(`ℹ️ Duplicate Webhook Received for ${gatewayTxnId}, ignoring.`);
                return res.json({ status: 'duplicate_ignored' });
            }

            console.log(`💰 Payment Captured! ID: ${gatewayTxnId} | Amount: ₹${amount}`);

            // 2. SETTLEMENT LOGIC (70/30)
            const driverShare = Math.round(amount * 0.70);
            const companyShare = Math.round(amount * 0.30);

            // A. Post to Driver Ledger
            await walletService.creditWallet({
                driverId,
                amount: driverShare,
                source: 'RIDE_PAYMENT',
                description: `Earning from Ride #${bookingId.toString().slice(-6)}`,
                bookingId,
                referenceId: `DRV_PAY_${gatewayTxnId}`,
                metadata: {
                    gatewayTransactionId: gatewayTxnId,
                    totalAmount: amount,
                    companyShare,
                    driverShare,
                    paymentMethod: 'RAZORPAY'
                }
            });

            // B. Post to Company Ledger
            await walletService.creditWallet({
                driverId: null, // Company
                amount: companyShare,
                source: 'COMMISSION',
                description: `Commission from #${bookingId.toString().slice(-6)}`,
                bookingId,
                referenceId: `COM_FEE_${gatewayTxnId}`,
                metadata: {
                    originalTransactionId: gatewayTxnId,
                    driverId
                }
            });

            // 3. UPDATE RIDE STATUS (Booking)
            if (bookingId) {
                await Booking.findByIdAndUpdate(bookingId, {
                    'payment.status': 'completed',
                    'payment.amount': amount,
                    'payment.transactionId': gatewayTxnId,
                    'payment.paidAt': new Date()
                });

                // Socket notification
                try {
                    const { getIO } = require('../socket');
                    const io = getIO();
                    if (io && driverId) {
                        io.to(`driver:${driverId}`).emit('payment:received', {
                            bookingId,
                            amount: driverShare,
                            fullAmount: amount,
                            transactionId: gatewayTxnId
                        });
                    }
                } catch (sErr) { }
            }
        } else if (event === 'payment.failed') {
            const payment = payload.payment.entity;
            const bookingId = payment.notes.bookingId;

            console.log(`❌ Payment Failed! ID: ${payment.id} | Booking: ${bookingId}`);

            if (bookingId) {
                await Booking.findByIdAndUpdate(bookingId, {
                    'payment.status': 'failed',
                    'payment.lastError': payment.error_description || 'Payment failed'
                });
            }
        }

        res.json({ status: 'ok' });

    } catch (error) {
        console.error('Webhook Error:', error);
        res.status(500).json({ status: 'error' });
    }
};

/**
 * 3. Generate Driver QR
 */
const getDriverQR = async (req, res) => {
    try {
        const driverId = req.user._id;

        // 1. Check if driver already has a Razorpay QR ID stored (Optimization)
        const driver = await Driver.findById(driverId);

        if (driver.razorpayQrId && driver.razorpayQrImageUrl) {
            return res.json({
                success: true,
                qrImage: driver.razorpayQrImageUrl,
                qrContent: driver.razorpayQrImageUrl, // Native QRs operate via the image URL
                type: 'native_upi'
            });
        }

        // 2. Generate new Native UPI QR
        const qr = await razorpayService.createQrCode(driver);

        // 3. Save to Driver Model (for next time)
        // Note: You might need to add these fields to your Driver Schema if strict
        // If strict schema, it will ignore these fields unless added.
        // For now we assume we can add them or they are mixed.
        // Ideally: Add razorpayQrId and razorpayQrImageUrl to Driver.js model

        driver.razorpayQrId = qr.id;
        driver.razorpayQrImageUrl = qr.image_url;
        await driver.save();

        res.json({
            success: true,
            qrImage: qr.image_url,
            qrContent: qr.image_url,
            type: 'native_upi'
        });

    } catch (error) {
        console.error('Get QR Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate QR' });
    }
};

/**
 * 5. Confirm Cash Payment
 * Called by driver when they receive cash from user
 */
const confirmCashPayment = async (req, res) => {
    try {
        const { bookingId, verificationPin } = req.body;
        const driverId = req.user._id;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // 1. VERIFICATION PIN CHECK (Risk Control)
        if (booking.verificationPin !== verificationPin) {
            return res.status(400).json({ success: false, message: 'Invalid verification PIN' });
        }

        if (booking.payment.status === 'completed') {
            return res.status(400).json({ success: false, message: 'Payment already completed' });
        }

        // 2. SETTLEMENT LOGIC (CASH)
        // User pays driver 100% (e.g., ₹500)
        // Driver owes company 30% (e.g., ₹150)
        const totalFare = booking.fare.total;
        const commission = Math.round(totalFare * 0.30);

        // Deduct commission from Driver Wallet (Debt)
        try {
            await walletService.debitWallet({
                driverId,
                amount: commission,
                source: 'COMMISSION_DEDUCTION',
                description: `Commission for Cash Ride #${bookingId.toString().slice(-6)}`,
                bookingId,
                referenceId: `DRV_CASH_COM_${bookingId}`,
                metadata: {
                    paymentMethod: 'CASH',
                    totalFare
                }
            });

            // Credit Company Wallet
            await walletService.creditWallet({
                driverId: null,
                amount: commission,
                source: 'COMMISSION',
                description: `Commission from Cash Ride #${bookingId.toString().slice(-6)}`,
                bookingId,
                referenceId: `COM_CASH_FEE_${bookingId}`,
                metadata: { driverId, totalFare }
            });
        } catch (walletError) {
            // If driver has insufficient balance, we still allow the ride to complete 
            // but the wallet will go negative (or we handle debt elsewhere)
            console.error('Wallet deduction failed during cash confirmation:', walletError.message);
        }

        // 3. UPDATE BOOKING
        booking.payment.status = 'completed';
        booking.payment.method = 'cash';
        booking.payment.paidAt = new Date();
        booking.status = 'completed';
        await booking.save();

        res.json({
            success: true,
            message: 'Cash payment confirmed and ride completed',
            booking
        });

    } catch (error) {
        console.error('Confirm Cash Error:', error);
        res.status(500).json({ success: false, message: 'Failed to confirm cash payment' });
    }
};

/**
 * 4. Request Payout
 */
const requestPayout = async (req, res) => {
    try {
        const { amount } = req.body;
        const driverId = req.user._id;

        // 1. Get Driver Fund Account
        const driver = await Driver.findById(driverId);

        if (!driver.bankDetails?.beneficiaryId) {
            // If no fund account id (beneficiaryId), create one
            try {
                const fundAccountId = await razorpayService.createFundAccount(driver);
                driver.bankDetails.beneficiaryId = fundAccountId;
                await driver.save();
            } catch (e) {
                return res.status(400).json({ success: false, message: 'Bank details invalid or not setup for payouts' });
            }
        }

        const accountDetails = {
            fundAccountId: driver.bankDetails.beneficiaryId
        };

        // 2. Validate Wallet Balance & Ledger Entry
        const walletResult = await walletService.requestPayout({
            driverId,
            amount
        });

        // 3. Trigger Razorpay Payout
        const payout = await razorpayService.createPayout(
            accountDetails,
            amount,
            walletResult.payoutId // Use the ID generated by wallet service
        );

        res.json({
            success: true,
            message: 'Payout initiated',
            payoutId: payout.id,
            status: payout.status
        });

    } catch (error) {
        console.error('Payout Request Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Payout failed' });
    }
};

module.exports = {
    createOrder,
    handleWebhook,
    getDriverQR,
    requestPayout,
    confirmCashPayment
};
