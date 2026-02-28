const Razorpay = require('razorpay');
const crypto = require('crypto');

/**
 * RAZORPAY SERVICE
 * Wraps all Razorpay SDK interactions
 */

// Initialize Razorpay
// Note: Keys should be in process.env
const getRazorpayInstance = () => {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.warn('⚠️ Razorpay keys missing in .env');
        // Return dummy functions for dev/test if keys missing, or throw error
        // For now, we'll try to instantiate, it will fail if keys are null
    }

    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });
};

/**
 * Create a Payment Order
 * @param {Number} amount - Amount in INR (will be converted to paise)
 * @param {String} referenceId - Internal reference ID (e.g. Booking ID)
 * @param {Object} notes - Additional metadata
 */
const createOrder = async (amount, referenceId, notes = {}) => {
    try {
        const instance = getRazorpayInstance();

        const options = {
            amount: Math.round(amount * 100), // Convert to paise
            currency: "INR",
            receipt: referenceId.toString(),
            notes: {
                ...notes,
                referenceId: referenceId.toString()
            }
        };

        const order = await instance.orders.create(options);
        return order;
    } catch (error) {
        console.error('Razorpay Create Order Error:', error);
        throw error;
    }
};

/**
 * Verify Payment Signature (Webhook/Frontend)
 */
const verifySignature = (orderId, paymentId, signature) => {
    const text = orderId + "|" + paymentId;
    const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text.toString())
        .digest('hex');

    return generated_signature === signature;
};

/**
 * Verify Webhook Signature
 */
const verifyWebhookSignature = (body, signature, secret) => {
    return Razorpay.validateWebhookSignature(body, signature, secret);
};

/**
 * Create a Payout (Fund Transfer)
 * Requires RazorpayX enabled
 */
const createPayout = async (accountDetails, amount, referenceId) => {
    try {
        const instance = getRazorpayInstance();

        // Note: This requires a Fund Account + Contact to be created first in RazorpayX flows.
        // For simplicity in this demo, we assume we have a fund_account_id if we were fully integrating.
        // If not, we would standardly use the 'transfers' API for Route or 'payouts' for X.
        // Here we will use a simplified flow or mock if not fully configured.

        if (!process.env.RAZORPAY_ACCOUNT_NUMBER) {
            throw new Error("RazorpayX Account Number not configured");
        }

        const payoutOptions = {
            account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
            fund_account_id: accountDetails.fundAccountId, // Driver's fund account ID
            amount: Math.round(amount * 100),
            currency: "INR",
            mode: "IMPS",
            purpose: "payout",
            queue_if_low_balance: true,
            reference_id: referenceId,
            narration: "Driver Payout"
        };

        const payout = await instance.payouts.create(payoutOptions);
        return payout;

    } catch (error) {
        console.error('Razorpay Payout Error:', error);
        throw error;
    }
};

/**
 * Create Contact & Fund Account (For new drivers)
 */
const createFundAccount = async (driver) => {
    try {
        const instance = getRazorpayInstance();

        // 1. Create Contact
        const contact = await instance.contacts.create({
            name: driver.name,
            email: driver.email,
            contact: driver.phone,
            type: "vendor",
            reference_id: driver._id.toString()
        });

        // 2. Create Fund Account (Bank)
        const fundAccount = await instance.fund_accounts.create({
            contact_id: contact.id,
            account_type: "bank_account",
            bank_account: {
                name: driver.bankDetails.accountHolderName,
                ifsc: driver.bankDetails.ifscCode,
                account_number: driver.bankDetails.accountNumber
            }
        });

        return fundAccount.id;

    } catch (error) {
        console.error('Razorpay Fund Account Creation Error:', error);
        throw error;
    }
};

/**
 * Create a Native UPI QR for the Driver
 * Configured as a "Fixed QR" but accepts any amount
 */
const createQrCode = async (driver) => {
    try {
        const instance = getRazorpayInstance();

        const options = {
            type: "upi_qr",
            name: `${driver.name} - Chardhogo`,
            usage: "multiple_use",
            fixed_amount: false,
            payment_capture: 1, // Auto capture
            description: `Payment to ${driver.name}`,
            notes: {
                driverId: driver._id.toString(),
                type: 'driver_qr'
            }
        };

        const qr = await instance.qrCode.create(options);
        return qr; // Contains image_url and id
    } catch (error) {
        console.error('Razorpay QR Creation Error:', error);
        throw error;
    }
};

module.exports = {
    createOrder,
    verifySignature,
    verifyWebhookSignature,
    createPayout,
    createFundAccount,
    createQrCode
};
