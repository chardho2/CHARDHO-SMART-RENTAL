try {
    const sdk = require('phonepe-payment-pg-node-sdk');
    console.log('SDK Imported:', Object.keys(sdk));

    const { PhonePePaymentClient, Constants } = sdk;

    // Credentials
    const merchantId = "M23O1I0Y2RN8W_2601041341";
    const saltKey = "ZmU0Y2I4ZTgtMWViNC00YTk5LTk3ZmYtYjJlMDBkNWRjYmYz";
    const saltIndex = 1;
    const env = Constants.Env.PRODUCTION;

    console.log('Initializing Client...');
    const client = new PhonePePaymentClient(merchantId, saltKey, saltIndex, env);
    console.log('Client Initialized');

    // Just creating a raw payload for pay page
    const merchantTransactionId = 'SDK_' + Date.now();
    const data = {
        merchantId: merchantId,
        merchantTransactionId: merchantTransactionId,
        merchantUserId: 'U123',
        amount: 100,
        redirectUrl: "https://google.com",
        redirectMode: "POST",
        callbackUrl: "https://webhook.site/callback",
        paymentInstrument: {
            type: "PAY_PAGE"
        }
    };

    const base64Data = Buffer.from(JSON.stringify(data)).toString('base64');

    // If the SDK has `pay` method, we need a Request object.
    // Inspecting keys might help if docs are scarce.
    // For now, let's just see if we got this far.

    console.log('SDK Setup Complete');

} catch (e) {
    console.error('CRASH:', e);
}
