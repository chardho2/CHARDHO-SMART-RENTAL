const axios = require('axios');
const fs = require('fs');
function log(msg) {
    console.log(msg);
    fs.appendFileSync('login_debug_output.txt', (typeof msg === 'object' ? JSON.stringify(msg, null, 2) : msg) + '\n');
}

async function testLogin() {
    if (fs.existsSync('login_debug_output.txt')) fs.unlinkSync('login_debug_output.txt');
    try {
        const apiUrl = 'http://127.0.0.1:4000/api/auth/login';
        log(`Testing login at ${apiUrl} ...`);
        const response = await axios.post(apiUrl, {
            email: 'shaikmuzzu600@gmail.com',
            password: 'password123'
        });
        log('Response Status: ' + response.status);
        log('Response Data: ' + JSON.stringify(response.data));
    } catch (error) {
        if (error.response) {
            log('❌ Server Error Status: ' + error.response.status);
            log('❌ Server Error Data: ' + JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            log('❌ No Response Received. Is the server running?');
        } else {
            log('❌ Error Message: ' + error.message);
        }
    }
}

testLogin().then(() => {
    console.log('Test completed.');
    process.exit(0);
}).catch(err => {
    console.error('Test script exploded:', err);
    process.exit(1);
});
