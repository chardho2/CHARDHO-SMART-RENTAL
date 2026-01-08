const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Driver = require('./models/Driver');

const EMAIL = 'shaikmuzzu600@gmail.com';
const NEW_PASSWORD = 'Muzamil@123'; // Change this to your desired password

async function fixUserPassword() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find user
        let user = await User.findOne({ email: EMAIL.toLowerCase() });
        let collection = 'User';

        if (!user) {
            user = await Driver.findOne({ email: EMAIL.toLowerCase() });
            collection = 'Driver';
        }

        if (!user) {
            console.log('❌ User not found!');
            process.exit(1);
        }

        console.log(`✅ Found user in ${collection} collection`);
        console.log(`📧 Email: ${user.email}`);
        console.log(`👤 Name: ${user.name || 'NOT SET'}`);
        console.log(`🔑 Current password exists: ${!!user.password}`);
        console.log(`🔑 Current password length: ${user.password ? user.password.length : 0}\n`);

        // Update password
        console.log(`🔧 Setting new password: ${NEW_PASSWORD}`);
        user.password = NEW_PASSWORD;
        await user.save();

        console.log('✅ Password updated successfully!');
        console.log('💡 User can now log in with email/password\n');

        // Verify the password was hashed
        const updatedUser = await (collection === 'User' ? User : Driver).findOne({ email: EMAIL.toLowerCase() });
        console.log(`🔐 Password is now hashed: ${updatedUser.password.startsWith('$2')}`);
        console.log(`🔐 New password length: ${updatedUser.password.length}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
    }
}

fixUserPassword();
