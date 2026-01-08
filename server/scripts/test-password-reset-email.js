require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../services/emailService');
const crypto = require('crypto');

/**
 * Test Password Reset Email
 * This script tests the password reset email functionality
 */

async function testPasswordResetEmail() {
    try {
        console.log('🧪 Testing Password Reset Email...\n');

        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find a test user
        const testUser = await User.findOne();

        if (!testUser) {
            console.log('❌ No users found in database. Please create a user first.');
            process.exit(1);
        }

        console.log(`📝 Using test user: ${testUser.name} (${testUser.email})\n`);

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetUrl = `chardhogo://reset-password?token=${resetToken}&type=user`;

        console.log('📧 Sending password reset email...\n');

        // Send email (will log to console in development mode)
        await sendPasswordResetEmail(
            testUser.email,
            testUser.name,
            resetUrl,
            resetToken
        );

        console.log('✅ Test completed!\n');
        console.log('💡 In development mode, the reset link is shown in the terminal above.');
        console.log('💡 In production, it will be sent via email.\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

testPasswordResetEmail();
