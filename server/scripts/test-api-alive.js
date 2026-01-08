const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

async function testApi() {
    try {
        console.log('🧪 Testing Forgot Password API on port 4001...');

        // 1. Get a valid email from DB
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne();
        if (!user) {
            console.log('❌ No user found in DB');
            process.exit(1);
        }
        console.log(`👤 Using user: ${user.email}`);

        // 2. Call API
        try {
            const response = await axios.post('http://localhost:4001/api/auth/forgot-password', {
                email: user.email,
                userType: 'user'
            });

            console.log('\n✅ API Success!');
            console.log('Response:', response.data);

            if (response.data.resetUrl) {
                console.log('\n🔗 RESET LINK FOUND IN RESPONSE (Dev Mode):');
                console.log(response.data.resetUrl);

                // Save to file for next step
                require('fs').writeFileSync('reset_flow_token.txt', JSON.stringify({
                    url: response.data.resetUrl,
                    token: response.data.resetToken
                }, null, 2));
            }

        } catch (err) {
            if (err.code === 'ECONNREFUSED') {
                console.log('\n❌ Server is NOT running on port 4000');
            } else {
                console.log('\n❌ API Error:', err.response ? err.response.data : err.message);
            }
        }

    } catch (error) {
        console.error('Test script error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testApi();
