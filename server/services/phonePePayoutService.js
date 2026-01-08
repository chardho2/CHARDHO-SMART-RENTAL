const crypto = require('crypto');
const axios = require('axios');

/**
 * PHONEPE PAYOUT SERVICE
 * Handles driver withdrawals to bank accounts
 * 
 * Documentation: https://developer.phonepe.com/v1/docs/payout-api
 */

// Configuration
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID || "M23O1I0Y2RN8W";
const SALT_KEY = process.env.PHONEPE_SALT_KEY || "fe4cb8e8-1eb4-4a99-97ff-b2e00d5dcbf3";
const SALT_INDEX = parseInt(process.env.PHONEPE_SALT_INDEX || "1");
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// PhonePe Payout URLs
const PAYOUT_PROD_URL = 'https://api.phonepe.com/apis/pg-sandbox';  // Update to prod when live
const PAYOUT_SANDBOX_URL = 'https://api-preprod.phonepe.com/apis/pg-sandbox';
const PAYOUT_HOST_URL = IS_PRODUCTION ? PAYOUT_PROD_URL : PAYOUT_SANDBOX_URL;

const CALLBACK_URL = process.env.PHONEPE_PAYOUT_CALLBACK_URL ||
    "https://chardhogo-backend.onrender.com/api/payout/callback";

/**
 * Generate checksum for PhonePe API
 */
function generateChecksum(payload, endpoint) {
    const stringToSign = payload + endpoint + SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
    return sha256 + '###' + SALT_INDEX;
}

/**
 * Initiate Payout to Driver Bank Account
 * 
 * @param {Object} payoutDetails
 * @param {String} payoutDetails.driverId - Driver ID
 * @param {Number} payoutDetails.amount - Amount in rupees
 * @param {String} payoutDetails.bankAccount - Bank account number
 * @param {String} payoutDetails.ifscCode - IFSC code
 * @param {String} payoutDetails.accountHolderName - Account holder name
 * @param {String} payoutDetails.payoutId - Unique payout ID
 * @param {String} payoutDetails.driverPhone - Driver phone number
 * @returns {Object} - Payout response
 */
const initiatePayout = async (payoutDetails) => {
    try {
        const {
            driverId,
            amount,
            bankAccount,
            ifscCode,
            accountHolderName,
            payoutId,
            driverPhone
        } = payoutDetails;

        // Validate inputs
        if (!amount || amount < 100) {
            throw new Error('Minimum payout amount is ₹100');
        }

        if (!bankAccount || !ifscCode || !accountHolderName) {
            throw new Error('Bank details are incomplete');
        }

        // Generate unique transaction ID
        const merchantTransactionId = payoutId || `PAYOUT_${driverId}_${Date.now()}`;
        const amountInPaise = Math.round(amount * 100);

        // Payload for PhonePe
        const payload = {
            merchantId: MERCHANT_ID,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: driverId,
            amount: amountInPaise,
            instrumentType: "BANK_ACCOUNT",
            instrumentDetails: {
                accountNumber: bankAccount,
                ifsc: ifscCode,
                accountHolderName: accountHolderName
            },
            callbackUrl: CALLBACK_URL
        };

        // Encode payload
        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
        const endpoint = '/v3/debit';
        const checksum = generateChecksum(base64Payload, endpoint);

        // API Request
        const options = {
            method: 'POST',
            url: `${PAYOUT_HOST_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'X-MERCHANT-ID': MERCHANT_ID
            },
            data: {
                request: base64Payload
            }
        };

        console.log(`💸 PhonePe Payout Initiated:`);
        console.log(`   Driver: ${driverId}`);
        console.log(`   Amount: ₹${amount}`);
        console.log(`   TxnID: ${merchantTransactionId}`);
        console.log(`   Bank: ${ifscCode} - ****${bankAccount.slice(-4)}`);

        const response = await axios(options);

        if (response.data.success) {
            console.log(`✅ Payout request accepted by PhonePe`);
            return {
                success: true,
                merchantTransactionId,
                gatewayTransactionId: response.data.data?.transactionId,
                status: 'PENDING',
                message: 'Payout initiated successfully',
                data: response.data
            };
        } else {
            console.error(`❌ PhonePe rejected payout:`, response.data);
            throw new Error(response.data.message || 'Payout failed');
        }

    } catch (error) {
        console.error('❌ PhonePe Payout Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || error.message || 'Payout initiation failed');
    }
};

/**
 * Check Payout Status
 * 
 * @param {String} merchantTransactionId - Transaction ID
 * @returns {Object} - Status response
 */
const checkPayoutStatus = async (merchantTransactionId) => {
    try {
        const endpoint = `/v3/transaction/${MERCHANT_ID}/${merchantTransactionId}/status`;
        const stringToSign = endpoint + SALT_KEY;
        const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
        const checksum = sha256 + '###' + SALT_INDEX;

        const options = {
            method: 'GET',
            url: `${PAYOUT_HOST_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'X-MERCHANT-ID': MERCHANT_ID
            }
        };

        console.log(`🔍 Checking payout status: ${merchantTransactionId}`);

        const response = await axios(options);

        return {
            success: response.data.success,
            status: response.data.code,
            data: response.data.data
        };

    } catch (error) {
        console.error('❌ Payout Status Check Error:', error.response?.data || error.message);
        throw new Error('Failed to check payout status');
    }
};

/**
 * Verify Payout Callback Signature
 * 
 * @param {String} base64Payload - Base64 encoded payload
 * @param {String} receivedChecksum - Checksum from PhonePe
 * @returns {Boolean} - Verification result
 */
const verifyPayoutCallback = (base64Payload, receivedChecksum) => {
    try {
        const stringToSign = base64Payload + SALT_KEY;
        const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
        const calculatedChecksum = sha256 + '###' + SALT_INDEX;

        const isValid = calculatedChecksum === receivedChecksum;
        console.log(`🔐 Payout webhook signature ${isValid ? 'VALID ✅' : 'INVALID ❌'}`);

        return isValid;
    } catch (error) {
        console.error('❌ Payout webhook verification error:', error.message);
        return false;
    }
};

/**
 * Get Account Balance (PhonePe Merchant Account)
 * 
 * @returns {Object} - Balance details
 */
const getAccountBalance = async () => {
    try {
        const endpoint = '/v1/balance';
        const stringToSign = endpoint + SALT_KEY;
        const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
        const checksum = sha256 + '###' + SALT_INDEX;

        const options = {
            method: 'GET',
            url: `${PAYOUT_HOST_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'X-MERCHANT-ID': MERCHANT_ID
            }
        };

        const response = await axios(options);

        return {
            success: response.data.success,
            balance: response.data.data?.amount / 100, // Convert paise to rupees
            currency: 'INR'
        };

    } catch (error) {
        console.error('❌ Balance Check Error:', error.response?.data || error.message);
        throw new Error('Failed to fetch account balance');
    }
};

/**
 * Validate Bank Account (Optional - if PhonePe supports)
 * 
 * @param {Object} bankDetails
 * @param {String} bankDetails.accountNumber
 * @param {String} bankDetails.ifscCode
 * @returns {Object} - Validation result
 */
const validateBankAccount = async (bankDetails) => {
    try {
        const { accountNumber, ifscCode } = bankDetails;

        // PhonePe may have a validation endpoint
        // This is a placeholder - check PhonePe docs for actual endpoint

        const payload = {
            merchantId: MERCHANT_ID,
            accountNumber,
            ifsc: ifscCode
        };

        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
        const endpoint = '/v1/validate/account';
        const checksum = generateChecksum(base64Payload, endpoint);

        const options = {
            method: 'POST',
            url: `${PAYOUT_HOST_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
                'X-MERCHANT-ID': MERCHANT_ID
            },
            data: {
                request: base64Payload
            }
        };

        const response = await axios(options);

        return {
            success: response.data.success,
            valid: response.data.data?.valid || false,
            accountHolderName: response.data.data?.name
        };

    } catch (error) {
        console.warn('⚠ Bank validation not available or failed:', error.message);
        return {
            success: false,
            valid: false,
            message: 'Validation service unavailable'
        };
    }
};

/**
 * Process Bulk Payouts (for daily settlements)
 * 
 * @param {Array} payouts - Array of payout objects
 * @returns {Object} - Bulk payout results
 */
const processBulkPayouts = async (payouts) => {
    const results = {
        total: payouts.length,
        successful: 0,
        failed: 0,
        details: []
    };

    for (const payout of payouts) {
        try {
            const result = await initiatePayout(payout);
            results.successful++;
            results.details.push({
                driverId: payout.driverId,
                status: 'SUCCESS',
                transactionId: result.merchantTransactionId
            });
        } catch (error) {
            results.failed++;
            results.details.push({
                driverId: payout.driverId,
                status: 'FAILED',
                error: error.message
            });
        }

        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`📊 Bulk Payout Summary: ${results.successful}/${results.total} successful`);

    return results;
};

module.exports = {
    initiatePayout,
    checkPayoutStatus,
    verifyPayoutCallback,
    getAccountBalance,
    validateBankAccount,
    processBulkPayouts
};
