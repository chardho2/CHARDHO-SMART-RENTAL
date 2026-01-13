
const axios = require('axios');
const fs = require('fs');

async function testRegisterAndLogin() {
    const apiUrl = 'http://127.0.0.1:4000/api/auth';
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    try {
        console.log(`Step 1: Registering ${testEmail}...`);
        const regRes = await axios.post(`${apiUrl}/register`, {
            name: 'Test User',
            email: testEmail,
            phone: '123456789012',
            password: testPassword,
            userType: 'user'
        });
        console.log('Registration Success:', regRes.data.success);

        console.log(`Step 2: Logging in with ${testEmail}...`);
        const loginRes = await axios.post(`${apiUrl}/login`, {
            email: testEmail,
            password: testPassword
        });
        console.log('Login Success:', loginRes.data.success);
        console.log('User Data:', loginRes.data.user);

    } catch (error) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

testRegisterAndLogin();
