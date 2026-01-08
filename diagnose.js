const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './server/.env' });

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// Import models
const User = require('./server/models/User');
const Driver = require('./server/models/Driver');

async function diagnoseAndFixUser(email) {
    try {
        console.log(`\n🔍 Diagnosing user: ${email}\n`);

        // Check User collection
        let user = await User.findOne({ email: email.toLowerCase() });
        let collection = 'User';

        if (!user) {
            // Check Driver collection
            user = await Driver.findOne({ email: email.toLowerCase() });
            collection = 'Driver';
        }

        if (!user) {
            console.log('❌ User not found in either collection');
            return;
        }

        console.log(`✅ Found in ${collection} collection`);
        console.log(`📧 Email: ${user.email}`);
        console.log(`👤 Name: ${user.name || 'NOT SET'}`);
        console.log(`📱 Phone: ${user.phone || 'NOT SET'}`);
        console.log(`🔑 Password exists: ${!!user.password}`);
        console.log(`🔑 Password length: ${user.password ? user.password.length : 0}`);
        console.log(`🔑 Password value (first 20 chars): ${user.password ? user.password.substring(0, 20) + '...' : 'EMPTY'}`);
        console.log(`👥 User Type: ${user.userType || 'NOT SET'}`);
        console.log(`🔐 Refresh Tokens: ${user.refreshTokens ? user.refreshTokens.length : 0}`);

        // Check if password is hashed (bcrypt hashes start with $2a$ or $2b$)
        const isHashed = user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));
        console.log(`🔐 Password is hashed: ${isHashed}`);

        // If password is empty or not set, create a new one
        if (!user.password || user.password.trim() === '') {
            console.log('\n⚠️  Password is empty or not set!');
            console.log('💡 This account was likely created via OAuth.');
            console.log('💡 User should use "Continue with Google" to log in.');
            console.log('\n🔧 Would you like to set a temporary password? (This will allow email/password login)');
            console.log('   If yes, manually run: node diagnose.js fix <email> <newPassword>');
        } else if (!isHashed) {
            console.log('\n⚠️  Password exists but is NOT hashed!');
            console.log('🔧 Fixing by hashing the password...');

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
            await user.save();

            console.log('✅ Password has been hashed and saved!');
        } else {
            console.log('\n✅ Password is properly set and hashed');
            console.log('💡 User can log in with email/password');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

async function setNewPassword(email, newPassword) {
    try {
        console.log(`\n🔧 Setting new password for: ${email}\n`);

        // Check User collection
        let user = await User.findOne({ email: email.toLowerCase() });
        let Model = User;

        if (!user) {
            // Check Driver collection
            user = await Driver.findOne({ email: email.toLowerCase() });
            Model = Driver;
        }

        if (!user) {
            console.log('❌ User not found in either collection');
            return;
        }

        // Validate password
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{5,15}$/;
        if (!passwordRegex.test(newPassword)) {
            console.log('❌ Password must be 5-15 characters with at least:');
            console.log('   - One lowercase letter');
            console.log('   - One uppercase letter');
            console.log('   - One number');
            console.log('   - One special character');
            return;
        }

        // Update password (pre-save hook will hash it)
        user.password = newPassword;
        await user.save();

        console.log('✅ Password updated successfully!');
        console.log('💡 User can now log in with email/password');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const email = args[1];
const password = args[2];

if (!command || !email) {
    console.log('Usage:');
    console.log('  node diagnose.js check <email>           - Check user account status');
    console.log('  node diagnose.js fix <email> <password>  - Set a new password for user');
    console.log('\nExample:');
    console.log('  node diagnose.js check shaikmuzzu600@gmail.com');
    console.log('  node diagnose.js fix shaikmuzzu600@gmail.com MyNewPass123!');
    process.exit(1);
}

if (command === 'check') {
    diagnoseAndFixUser(email);
} else if (command === 'fix') {
    if (!password) {
        console.log('❌ Password is required for fix command');
        console.log('Usage: node diagnose.js fix <email> <password>');
        process.exit(1);
    }
    setNewPassword(email, password);
} else {
    console.log('❌ Invalid command. Use "check" or "fix"');
    process.exit(1);
}
