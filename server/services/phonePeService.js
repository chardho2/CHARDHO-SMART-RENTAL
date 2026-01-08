const crypto = require('crypto');

// Try to load PhonePe SDK
let PhonePeSDK = null;
let sdkAvailable = false;

try {
    PhonePeSDK = require('phonepe-pg-sdk-node');
    sdkAvailable = true;
    console.log('✓ PhonePe SDK loaded successfully');
} catch (error) {
    console.warn('⚠ PhonePe SDK not installed. Using manual API mode.');
    console.warn('  Install with: npm i https://phonepe.mycloudrepo.io/public/repositories/phonepe-pg-sdk-node/releases/v2/phonepe-pg-sdk-node-2.0.3.tgz');
}

// Configuration from .env
const CLIENT_ID = process.env.PHONEPE_MERCHANT_ID || "M23O1I0Y2RN8W";
const CLIENT_SECRET = process.env.PHONEPE_SALT_KEY || "fe4cb8e8-1eb4-4a99-97ff-b2e00d5dcbf3";
const CLIENT_VERSION = parseInt(process.env.PHONEPE_SALT_INDEX || "1");
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const CALLBACK_URL = process.env.PHONEPE_CALLBACK_URL || "https://chardhogo-backend.onrender.com/api/payment/callback";

// PhonePe URLs
const PHONEPE_PROD_URL = 'https://api.phonepe.com/apis/hermes';
const PHONEPE_SANDBOX_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
const PHONEPE_HOST_URL = IS_PRODUCTION ? PHONEPE_PROD_URL : PHONEPE_SANDBOX_URL;

/**
 * PhonePe Payment Service
 * Supports both SDK and Manual API modes
 */
const phonePeService = {

    /**
     * Initiate Payment
     * @param {Object} paymentDetails { amount, userId, bookingId, userPhone }
     * @returns {Object} response from PhonePe
     */
    initiatePayment: async ({ amount, userId, bookingId, userPhone }) => {
        const axios = require('axios');

        try {
            const merchantTransactionId = `TXN_${bookingId}_${Date.now()}`;
            const amountInPaise = Math.round(amount * 100);

            const payload = {
                merchantId: CLIENT_ID,
                merchantTransactionId: merchantTransactionId,
                merchantUserId: userId,
                amount: amountInPaise,
                redirectUrl: `https://chardhogo-app.com/payment/status?id=${merchantTransactionId}`,
                redirectMode: "REDIRECT",
                callbackUrl: CALLBACK_URL,
                mobileNumber: userPhone,
                paymentInstrument: {
                    type: "PAY_PAGE"
                }
            };

            const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
            const stringToSign = base64Payload + "/pg/v1/pay" + CLIENT_SECRET;
            const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
            const checksum = sha256 + "###" + CLIENT_VERSION;

            const options = {
                method: 'post',
                url: `${PHONEPE_HOST_URL}/pg/v1/pay`,
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': checksum
                },
                data: {
                    request: base64Payload
                }
            };

            console.log(`💸 PhonePe Payment Init: Merchant=${CLIENT_ID}, Env=${IS_PRODUCTION ? 'PROD' : 'SANDBOX'}`);
            console.log(`   URL: ${PHONEPE_HOST_URL}/pg/v1/pay`);
            console.log(`   TxnID: ${merchantTransactionId}`);

            const response = await axios(options);

            return {
                success: response.data.success,
                merchantTransactionId,
                data: response.data
            };

        } catch (error) {
            console.error('❌ PhonePe Payment Error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.message || 'Payment initiation failed');
        }
    },

    /**
     * Check Payment Status
     * @param {String} merchantTransactionId 
     */
    checkStatus: async (merchantTransactionId) => {
        const axios = require('axios');

        try {
            const stringToSign = `/pg/v1/status/${CLIENT_ID}/${merchantTransactionId}` + CLIENT_SECRET;
            const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
            const checksum = sha256 + "###" + CLIENT_VERSION;

            const options = {
                method: 'get',
                url: `${PHONEPE_HOST_URL}/pg/v1/status/${CLIENT_ID}/${merchantTransactionId}`,
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': checksum,
                    'X-MERCHANT-ID': CLIENT_ID
                }
            };

            console.log(`🔍 Checking status for: ${merchantTransactionId}`);

            const response = await axios(options);
            return response.data;

        } catch (error) {
            console.error('❌ PhonePe Status Check Error:', error.response?.data || error.message);
            throw new Error('Failed to check payment status');
        }
    },

    /**
     * Verify Callback Signature (Webhook)
     * @param {String} base64Payload 
     * @param {String} receivedChecksum 
     * @returns {Boolean}
     */
    verifyCallback: (base64Payload, receivedChecksum) => {
        try {
            const stringToSign = base64Payload + CLIENT_SECRET;
            const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
            const calculatedChecksum = sha256 + "###" + CLIENT_VERSION;

            const isValid = calculatedChecksum === receivedChecksum;
            console.log(`🔐 Webhook signature ${isValid ? 'VALID' : 'INVALID'}`);

            return isValid;
        } catch (error) {
            console.error('❌ Webhook verification error:', error.message);
            return false;
        }
    },

    /**
     * Initiate Refund
     * @param {Object} refundDetails { originalTransactionId, amount, refundId, reason }
     */
    initiateRefund: async ({ originalTransactionId, amount, refundId, reason }) => {
        const axios = require('axios');

        try {
            const merchantRefundId = refundId || `REF_${Date.now()}`;
            const amountInPaise = Math.round(amount * 100);

            const payload = {
                merchantId: CLIENT_ID,
                merchantTransactionId: originalTransactionId,
                merchantRefundId: merchantRefundId,
                amount: amountInPaise,
                callbackUrl: CALLBACK_URL
            };

            const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
            const stringToSign = base64Payload + "/pg/v1/refund" + CLIENT_SECRET;
            const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
            const checksum = sha256 + "###" + CLIENT_VERSION;

            const options = {
                method: 'post',
                url: `${PHONEPE_HOST_URL}/pg/v1/refund`,
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': checksum
                },
                data: {
                    request: base64Payload
                }
            };

            console.log(`💰 PhonePe Refund Init: ${merchantRefundId} for ₹${amount}`);

            const response = await axios(options);
            return response.data;

        } catch (error) {
            console.error('❌ PhonePe Refund Error:', error.response?.data || error.message);
            throw new Error('Refund initiation failed');
        }
    }
};

module.exports = phonePeService;
