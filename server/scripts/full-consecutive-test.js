const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');
const fs = require('fs');
require('dotenv').config(); // Automatically picks up .env in CWD

async function fullTest() {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        log('🧪 STARTING FULL PASSWORD RESET TEST...');

        // 1. Get User
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne();
        if (!user) throw new Error('No user found');
        log(`👤 User: ${user.email}`);

        // 2. Request Forgot Password
        log('📡 Requesting Forgot Password...');
        const forgotRes = await axios.post('http://localhost:4001/api/auth/forgot-password', {
            email: user.email,
            userType: 'user'
        });

        log('✅ Forgot Password Response: ' + JSON.stringify(forgotRes.data));

        const resetToken = forgotRes.data.resetToken;
        if (!resetToken) throw new Error('No resetToken returned (Is NODE_ENV=development?)');
        log(`🔑 Got Reset Token: ${resetToken.substring(0, 10)}...`);

        // 3. Reset Password
        log('📡 Resetting Password...');
        const newPassword = 'TestPassword123!';

        const resetRes = await axios.post('http://localhost:4001/api/auth/reset-password', {
            token: resetToken,
            userType: 'user',
            newPassword: newPassword
        });

        log('✅ Reset Password Response: ' + JSON.stringify(resetRes.data));
        log('🎉 FULL FLOW SUCCESSFUL!');

    } catch (error) {
        log('❌ TEST FAILED');
        if (error.response) {
            log(`Status: ${error.response.status}`);
            log(`Data: ${JSON.stringify(error.response.data)}`);
        } else {
            log(`Error: ${error.message}`);
        }
    } finally {
        await mongoose.disconnect();
        fs.writeFileSync('full_test_result.txt', output);
    }
}

fullTest();
