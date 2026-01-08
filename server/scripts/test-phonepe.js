const axios = require('axios');
const crypto = require('crypto');

// SANDBOX CREDENTIALS
const PHONEPE_HOST_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox";
const MERCHANT_ID = "PGTESTPAYUAT";
const SALT_KEY = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
const SALT_INDEX = "1";

const testPayment = async () => {
    try {
        const merchantTransactionId = `TEST_${Date.now()}`;
        const amountInPaise = 10000; // 100 INR

        const payload = {
            merchantId: MERCHANT_ID,
            merchantTransactionId: merchantTransactionId,
            merchantUserId: "TEST_USER_123",
            amount: amountInPaise,
            redirectUrl: "https://example.com/callback",
            redirectMode: "REDIRECT",
            callbackUrl: "https://example.com/callback",
            mobileNumber: "9999999999",
            paymentInstrument: {
                type: "PAY_PAGE"
            }
        };

        const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
        const stringToSign = base64Payload + "/pg/v1/pay" + SALT_KEY;
        const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
        const checksum = sha256 + "###" + SALT_INDEX;

        console.log('Sending request to:', `${PHONEPE_HOST_URL}/pg/v1/pay`);
        console.log('Merchant ID:', MERCHANT_ID);
        console.log('Checksum:', checksum);

        const options = {
            method: 'post',
            url: `${PHONEPE_HOST_URL}/pg/v1/pay`,
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
            },
            data: {
                request: base64Payload
            }
        };

        const response = await axios(options);
        console.log('✅ Success:', response.data);

    } catch (error) {
        console.error('❌ Error:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
};

testPayment();
