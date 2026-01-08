const { PhonePePaymentClient, PayPagePaymentRequest, CONSTANTS } = require('phonepe-payment-pg-node-sdk');
const fs = require('fs');
const util = require('util');

// Setup logging
const logFile = fs.createWriteStream(__dirname + '/phonepe-sdk-result.log', { flags: 'w' });
const logStdout = process.stdout;

console.log = function (...args) {
    const msg = util.format(...args);
    logFile.write(msg + '\n');
    logStdout.write(msg + '\n');
};

console.error = function (...args) {
    const msg = util.format(...args);
    logFile.write(msg + '\n');
    logStdout.write(msg + '\n');
};

// Credentials from User
const CLIENT_ID = "M23O1I0Y2RN8W_2601041341";
const CLIENT_SECRET = "ZmU0Y2I4ZTgtMWViNC00YTk5LTk3ZmYtYjJlMDBkNWRjYmYz";
const CLIENT_VERSION = 1;
const ENV = CONSTANTS.ENV.PRODUCTION; // User said 'Generated on Jan 04' -> Production keys

console.log('--- PhonePe SDK Diagnostic Test ---');
console.log('Client ID:', CLIENT_ID);
console.log('Client Version:', CLIENT_VERSION);
console.log('Environment:', 'PRODUCTION');

try {
    const phonePeClient = new PhonePePaymentClient(
        CLIENT_ID,
        CLIENT_SECRET,
        CLIENT_VERSION,
        ENV
    );

    const merchantTransactionId = 'SDK_TEST_' + Date.now();
    const payload = {
        merchantId: CLIENT_ID.split('_')[0], // Extract Merchant ID from Client ID if possible, or use Client ID? SDK might require specific mapping.
        // Wait, SDK constructor takes (merchantId, saltKey, saltIndex, env).
        // The user said "Client ID" = "M23O1I0Y2RN8W_2601041341".
        // The user said "Client Secret" = "ZmU0Y2I4ZTgtMWViNC00YTk5LTk3ZmYtYjJlMDBkNWRjYmYz".
        // The user said "Client Version" = 1.

        // Let's assume:
        // merchantId = CLIENT_ID
        // saltKey = CLIENT_SECRET
        // saltIndex = CLIENT_VERSION

        merchantTransactionId: merchantTransactionId,
        merchantUserId: 'TEST_USER_SDK',
        amount: 100, // 1.00 INR
        redirectUrl: 'https://webhook.site/test-callback',
        redirectMode: 'POST',
        callbackUrl: 'https://webhook.site/test-callback',
        paymentInstrument: {
            type: 'PAY_PAGE'
        }
    };

    console.log('Initiating Payment Request...');

    // SDK usage: pay(request)
    // The SDK expects a 'PayPagePaymentRequest' object or similar?
    // Let's rely on the client.pay() method accepting the payload directly or constructing the request object.

    // NOTE: The SDK might validate fields.

    // Construct Request
    const request = PayPagePaymentRequest.fromJson(payload);

    phonePeClient.pay(request).then(response => {
        console.log('\n✅ SDK SUCCESS');
        console.log(JSON.stringify(response, null, 2));
    }).catch(error => {
        console.error('\n❌ SDK FAILURE');
        console.error(error);
    });

} catch (error) {
    console.error('\n❌ SCRIPT ERROR');
    console.error(error);
}
