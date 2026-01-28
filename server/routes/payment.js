const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken, requireDriver } = require('../middleware/auth');

// Public
// Webhook must be public and handle its own signature verification
router.post('/webhook', paymentController.handleWebhook);

// Protected (User/Driver)
// Create Order (User scans QR -> calls this)
router.post('/create-order', authenticateToken, paymentController.createOrder);

// Driver Only
router.get('/qr', authenticateToken, requireDriver, paymentController.getDriverQR);
router.post('/payout', authenticateToken, requireDriver, paymentController.requestPayout);
router.post('/confirm-cash', authenticateToken, requireDriver, paymentController.confirmCashPayment);

module.exports = router;
