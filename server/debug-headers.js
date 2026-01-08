const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const util = require('util');

const logFile = fs.createWriteStream(__dirname + '/phonepe-combo-test.log', { flags: 'w' });
const logStdout = process.stdout;

console.log = function (...args) {
    const msg = util.format(...args);
    logFile.write(msg + '\n');
    logStdout.write(msg + '\n');
};

const SHORT_ID = "M23O1I0Y2RN8W";
// Decoding the base64 secret to UUID
const SECRET_BASE64 = "ZmU0Y2I4ZTgtMWViNC00YTk5LTk3ZmYtYjJlMDBkNWRjYmYz";
const SECRET_UUID = Buffer.from(SECRET_BASE64, 'base64').toString('utf8');
const INDEX = 1;

async function trySecret(name, host, merchantId, secret) {
    console.log(`\n--- Testing Secret: ${name} ---`);
    console.log(`Secret: ${secret}`);

    const payload = {
        merchantId: merchantId,
        merchantTransactionId: 'TEST_' + Date.now(),
        merchantUserId: 'TEST_USER',
        amount: 100,
        redirectUrl: 'https://webhook.site/cb',
        redirectMode: 'POST',
        callbackUrl: 'https://webhook.site/cb',
        paymentInstrument: { type: 'PAY_PAGE' }
    };

    const base64 = Buffer.from(JSON.stringify(payload)).toString('base64');
    const sign = base64 + '/pg/v1/pay' + secret;
    const checksum = crypto.createHash('sha256').update(sign).digest('hex') + '###' + INDEX;

    try {
        const res = await axios.post(`${host}/pg/v1/pay`, { request: base64 }, {
            headers: {
                'Content-Type': 'application/json',
                'X-VERIFY': checksum,
            }
        });
        console.log('✅ SUCCESS');
        console.log(res.data);
    } catch (e) {
        console.log(`❌ FAILED: ${e.message}`);
        if (e.response) {
            console.log(`Status: ${e.response.status}`);
            console.log('Data:', JSON.stringify(e.response.data));
        }
    }
}

async function run() {
    await trySecret('Decoded UUID', 'https://api.phonepe.com/apis/hermes', SHORT_ID, SECRET_UUID);
}

run();
