const jwt = require('jsonwebtoken');
const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Driver = require('../models/Driver');
const axios = require('axios');
const { authLimiter, registrationLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

// Helper: Generate Tokens
const generateTokens = (user) => {
    const payload = { id: user._id, userType: user.userType };

    // Access Token (Short-lived)
    const accessToken = jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Refresh Token (Long-lived)
    const refreshToken = jwt.sign(
        payload,
        process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET + "_refresh", // Fallback if env not set
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
};

// Helper: Manage Refresh Token storage
const storeRefreshToken = async (user, refreshToken, deviceId, deviceName) => {
    // Remove any existing token for this device ID to prevent duplicates/stale tokens
    user.refreshTokens = user.refreshTokens.filter(rt => rt.deviceId !== deviceId);

    // Add new token
    user.refreshTokens.push({
        token: refreshToken,
        deviceId: deviceId || 'unknown_device',
        deviceName: deviceName || 'Unknown Device',
        createdAt: new Date()
    });

    // Optional: Cleanup old tokens (e.g., keep last 10 sessions)
    if (user.refreshTokens.length > 10) {
        user.refreshTokens = user.refreshTokens.slice(-10);
    }

    await user.save();
};

// --- GOOGLE LOGIN ---
router.post('/google', async (req, res) => {
    try {
        const { token, userType = 'user', deviceId, deviceName } = req.body;

        console.log(`🔒 Google Login Request for: ${userType}`);

        if (!token) {
            return res.status(400).json({ success: false, message: 'No token provided' });
        }

        // 1. Verify token with Google
        const googleRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const { email, name, sub, picture } = googleRes.data;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Google authentication failed' });
        }

        // 2. Check if user exists in the CORRECT collection
        let user;
        const isDriver = userType === 'driver';
        const Model = isDriver ? Driver : User;

        user = await Model.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log(`🆕 Creating new ${userType} from Google: ${email}`);

            // Create new user (Auto-Register)
            // Generate a random compliant password
            const dummyPassword = Math.random().toString(36).slice(-8) + 'A1!';

            // Generate a unique dummy phone number (13 digits - fits validation)
            // Using last 13 chars of timestamp + random to ensure uniqueness
            const timestamp = Date.now().toString();
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const dummyPhone = (timestamp + random).slice(0, 15);

            const userData = {
                name: name,
                email: email.toLowerCase(),
                phone: dummyPhone,
                password: dummyPassword,
                profilePicture: picture,
                isVerified: true // Email verified by Google
            };

            if (!isDriver) {
                userData.userType = 'user';
            } else {
                // Driver specific fields
                userData.isActive = true;
                userData.isOnline = false;
            }

            user = new Model(userData);
            await user.save();
        } else {
            console.log(`✅ Found existing ${userType}: ${email}`);
        }

        // 3. Generate Tokens
        // Ensure userType is passed correctly for the token payload
        const payload = {
            _id: user._id,
            userType: isDriver ? 'driver' : 'user'
        };

        const tokens = generateTokens(payload);

        // 4. Store Refresh Token
        await storeRefreshToken(user, tokens.refreshToken, deviceId || `google_${Date.now()}`, deviceName || 'Google Login');

        // 5. Set Refresh Token as HTTP-only Cookie
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Ensure response user object has userType
        const userResponse = user.toJSON();
        userResponse.userType = isDriver ? 'driver' : 'user';

        res.json({
            success: true,
            message: 'Google login successful',
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: userResponse
        });

    } catch (error) {
        console.error('Google login error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            message: 'Google login failed',
            error: error.message
        });
    }
});

// Validation helpers
const validateEmail = (email) => {
    const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
};

const validatePhone = (phone) => {
    const re = /^[0-9]{10,15}$/;
    return re.test(phone);
};

const validatePassword = (password) => {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{5,15}$/;
    return re.test(password);
};

// Register user or driver
router.post('/register', registrationLimiter, async (req, res) => {
    // Lazy load socket tools to avoid circular deps
    const NotificationService = require('../services/notificationService');
    const { getIO } = require('../socket');

    try {
        const { name, email, phone, password, userType, deviceId, deviceName } = req.body;

        console.log('📝 Registration request:', { name, email, userType });

        // Validate input
        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        if (!validateEmail(email)) return res.status(400).json({ success: false, message: 'Invalid email format' });
        if (!validatePhone(phone)) return res.status(400).json({ success: false, message: 'Invalid phone number' });
        if (!validatePassword(password)) return res.status(400).json({ success: false, message: 'Invalid password format' });

        // Check if email exists in BOTH collections
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        const existingDriver = await Driver.findOne({ email: email.toLowerCase() });

        if (existingUser || existingDriver) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        // Check if phone exists in BOTH collections
        const existingUserByPhone = await User.findOne({ phone });
        const existingDriverByPhone = await Driver.findOne({ phone });

        if (existingUserByPhone || existingDriverByPhone) {
            return res.status(400).json({ success: false, message: 'Phone already exists' });
        }

        let user;
        const isDriver = userType === 'driver';

        if (isDriver) {
            // Create driver in Driver collection
            console.log('✅ Creating DRIVER in Driver collection');

            const driverData = {
                name: name.trim(),
                email: email.toLowerCase().trim(),
                phone: phone.trim(),
                password: password,
                isOnline: false,
                isActive: true,
                rating: 0,
                totalRides: 0,
                totalEarnings: 0
            };

            // Only add vehicle data if at least vehicle type is provided
            if (req.body.vehicleType) {
                driverData.vehicle = {
                    type: req.body.vehicleType,
                    model: req.body.vehicleModel || null,
                    plateNumber: req.body.vehiclePlateNumber || null,
                    color: req.body.vehicleColor || null,
                    year: req.body.vehicleYear || null
                };
                console.log('✅ Vehicle data included:', driverData.vehicle);
            } else {
                console.log('⚠️ No vehicle data provided - driver can add it later');
            }

            user = new Driver(driverData);
            await user.save();
            console.log('✅ Driver created successfully in Driver collection:', user.name);
        } else {
            // Create regular user in User collection
            console.log('✅ Creating USER in User collection');

            user = new User({
                name: name.trim(),
                email: email.toLowerCase().trim(),
                phone: phone.trim(),
                password: password,
                userType: 'user'
            });

            await user.save();
            console.log('✅ User created successfully in User collection:', user.name);
        }

        // Send Welcome Notification
        const io = getIO();
        const notificationRecipientId = user._id.toString();
        const notificationRecipientType = isDriver ? 'driver' : 'user';

        if (io) {
            // Welcome notification for all users
            await NotificationService.notifySystem(io, notificationRecipientId, notificationRecipientType, {
                title: '👋 Welcome to CharDhoGo',
                message: `Thanks for joining us, ${name.split(' ')[0]}! We're excited to have you on board.`,
                actionUrl: isDriver ? '/(driver)/tabs/profile' : '/account/profile',
                priority: 'high'
            });

            // Additional notifications for drivers
            if (isDriver) {
                // Document upload reminder
                await NotificationService.notifySystem(io, notificationRecipientId, notificationRecipientType, {
                    title: '📄 Upload Your Documents',
                    message: 'Please upload your driving license, Aadhar card, and vehicle RC to start accepting rides.',
                    actionUrl: '/(driver)/tabs/profile',
                    priority: 'high'
                });

                // Bank details reminder
                await NotificationService.notifySystem(io, notificationRecipientId, notificationRecipientType, {
                    title: '🏦 Add Bank Details',
                    message: 'Set up your bank account to receive earnings. Verification required for payouts.',
                    actionUrl: '/(driver)/bank-details',
                    priority: 'medium'
                });
            }
        }

        // Generate Tokens
        const tokens = generateTokens({ _id: user._id, userType: isDriver ? 'driver' : 'user' });
        await storeRefreshToken(user, tokens.refreshToken, deviceId || `web_${Date.now()}`, deviceName || 'Web Browser');

        // Set Refresh Token as HTTP-only Cookie
        res.cookie('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            success: true,
            message: `${isDriver ? 'Driver' : 'User'} registered successfully`,
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: { ...user.toJSON(), userType: isDriver ? 'driver' : 'user' }
        });
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ success: false, message: 'Server error during registration', error: error.message });
    }
});

// Login user or driver
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password, deviceId, deviceName } = req.body;

        console.log('🔐 Login attempt:', { email, hasPassword: !!password });

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Check in users collection first
        let user = await User.findOne({ email: email.toLowerCase() });
        let userType = 'user';
        let Model = User;

        if (user) {
            console.log('✅ Found in User collection:', user.name || user.email);
        }

        // If not found in users, check drivers collection
        if (!user) {
            user = await Driver.findOne({ email: email.toLowerCase() });
            if (user) {
                userType = 'driver';
                Model = Driver;
                console.log('✅ Found in Driver collection:', user.name || user.email);
            }
        }

        if (!user) {
            console.log('❌ User/Driver not found with email:', email);
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches (if user has one)
        let isMatch = false;
        if (user.password && user.password.trim() !== '') {
            console.log('🔑 Comparing passwords...');
            isMatch = await bcrypt.compare(password, user.password);
        } else {
            console.log('❌ User/Driver has no password set (OAuth account)');
        }

        if (!isMatch) {
            console.log('❌ Password mismatch or no password set for:', email);
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        console.log('✅ Password matched! Logging in as:', userType);

        // Generate Tokens with userType
        const payload = { id: user._id, userType };
        const accessToken = jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        const refreshToken = jwt.sign(
            payload,
            process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET + "_refresh",
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d' }
        );

        // Store refresh token
        await storeRefreshToken(user, refreshToken, deviceId || `unknown_${Date.now()}`, deviceName || 'Unknown Device');

        // Set Refresh Token as HTTP-only Cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            success: true,
            message: 'Login successful',
            token: accessToken,
            refreshToken: refreshToken,
            user: { ...user.toJSON(), userType }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
    }
});

// REFRESH TOKEN ENDPOINT
router.post('/refresh-token', async (req, res) => {
    // Try to get refresh token from cookie first, then from body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Refresh Token required' });
    }

    try {
        // Verify token signature
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET + "_refresh");

        // Find user in User collection first
        let user = await User.findById(decoded.id);

        // If not found, check Driver collection
        if (!user) {
            user = await Driver.findById(decoded.id);
        }

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if token serves a valid session
        const session = user.refreshTokens.find(rt => rt.token === refreshToken);
        if (!session) {
            return res.status(403).json({ success: false, message: 'Invalid Refresh Token (Session not found)' });
        }

        // Issue new Access Token
        const newAccessToken = jwt.sign(
            { id: user._id, userType: decoded.userType || 'user' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            token: newAccessToken
        });

    } catch (error) {
        console.error('Refresh token error:', error);
        return res.status(403).json({ success: false, message: 'Invalid or Expired Refresh Token' });
    }
});

// LOGOUT ENDPOINT
router.post('/logout', async (req, res) => {
    // Try to get refresh token from cookie first, then from body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    // Clear the cookie
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });

    // Even if no refresh token sent, we just say success to client (stateless access tokens die on their own)
    if (!refreshToken) return res.status(200).json({ success: true, message: 'Logged out' });

    try {
        // We decode to get ID, or just search all users (inefficient). 
        // Better: client should send user ID or we rely on the refreshToken finding the user.
        // Since we don't force auth middleware on logout (might be expired), we try to verify.

        const decoded = jwt.decode(refreshToken); // Just decode to get ID
        if (decoded && decoded.id) {
            const user = await User.findById(decoded.id);
            if (user) {
                // Remove this token
                user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== refreshToken);
                await user.save();
            }
        }
        res.json({ success: true, message: 'Logged out successfully' });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, message: 'Logout failed' });
    }
});

// Get user by ID (for verification)
router.get('/user/:id', async (req, res) => {
    try {
        let user = await User.findById(req.params.id).select('-password');
        let userType = 'user';

        if (!user) {
            user = await Driver.findById(req.params.id).select('-password');
            userType = 'driver';
        }

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Ensure userType/role is attached
        const userObj = user.toObject();
        userObj.userType = userObj.userType || userType;

        res.json({ success: true, user: userObj });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ========================================
// PASSWORD RESET ROUTES
// ========================================

const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../services/emailService');

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset link to email
 * @access  Public
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email, userType } = req.body; // userType: 'user' or 'driver'

        console.log(`🔐 Password reset requested for: ${email} (${userType})`);

        // Validate input
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Find user/driver by email
        const Model = userType === 'driver' ? Driver : User;
        const account = await Model.findOne({ email: email.toLowerCase() });

        // Always return success to prevent email enumeration
        if (!account) {
            console.log(`⚠️  Email not found: ${email}`);
            // Still return success for security
            return res.json({
                success: true,
                message: 'If an account exists with this email, a password reset link has been sent.'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

        // Hash the token before saving to database
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Save hashed token and expiry to database
        // Save hashed token and expiry to database
        // Use updateOne to bypass full document validation (avoids issues with legacy invalid refreshTokens)
        await Model.updateOne(
            { _id: account._id },
            {
                $set: {
                    resetPasswordToken: hashedToken,
                    resetPasswordExpires: resetTokenExpiry
                }
            }
        );

        // Create reset URL (matches format: chardhogo://reset-password?token=...&email=...&type=...)
        const resetUrl = `chardhogo://reset-password?token=${resetToken}&email=${email}&type=${userType}`;

        console.log(`📧 Reset URL generated`);

        // Send email with reset link
        try {
            await sendPasswordResetEmail(account.email, account.name, resetUrl, resetToken);

            console.log(`✅ Password reset email sent to: ${email}`);

            res.json({
                success: true,
                message: 'Password reset link has been sent to your email.',
                // For development/testing only - remove in production
                ...(process.env.NODE_ENV === 'development' && {
                    resetToken,
                    resetUrl,
                    // Add Expo Go compatible link
                    expoUrl: `exp://192.168.29.199:8081/--/reset-password?token=${resetToken}&email=${email}&type=${userType}`,
                    // Add Web/HTTPS format (if you implemented web handling)
                    webUrl: `https://chardhogo.com/reset-password?token=${resetToken}&email=${email}&type=${userType}`
                })
            });
        } catch (emailError) {
            console.error('❌ Email sending failed:', emailError.message);

            // Clear the reset token if email fails
            // Clear the reset token if email fails
            await Model.updateOne(
                { _id: account._id },
                {
                    $unset: {
                        resetPasswordToken: 1,
                        resetPasswordExpires: 1
                    }
                }
            );

            res.status(500).json({
                success: false,
                message: 'Failed to send reset email. Please try again later.'
            });
        }

    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword, userType } = req.body;

        console.log(`🔐 Password reset attempt with token`);

        // Validate input
        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token and new password are required'
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Hash the token to compare with database
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user/driver with valid reset token
        const Model = userType === 'driver' ? Driver : User;
        const account = await Model.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() } // Token not expired
        });

        if (!account) {
            console.log(`❌ Invalid or expired token`);
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Update password (manually hash since we're using updateOne)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear reset token
        // Also clear all refresh tokens to force logout from all devices (Security Best Practice)
        await Model.updateOne(
            { _id: account._id },
            {
                $set: {
                    password: hashedPassword,
                    refreshTokens: [] // Revoke all sessions
                },
                $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 }
            }
        );

        console.log(`✅ Password reset successful for: ${account.email}`);

        res.json({
            success: true,
            message: 'Password has been reset successfully. You can now login with your new password.'
        });

    } catch (error) {
        console.error('❌ Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

/**
 * @route   POST /api/auth/verify-reset-token
 * @desc    Verify if reset token is valid
 * @access  Public
 */
router.post('/verify-reset-token', async (req, res) => {
    try {
        const { token, userType } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        // Hash the token
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find account with valid token
        const Model = userType === 'driver' ? Driver : User;
        const account = await Model.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!account) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        res.json({
            success: true,
            message: 'Token is valid',
            email: account.email
        });

    } catch (error) {
        console.error('❌ Verify token error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router;
