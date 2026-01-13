const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        console.log(`🔐 Auth Middleware: Checking token for ${req.path}`);

        // Get token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            console.log(`❌ Auth Middleware: No token provided for ${req.path}`);
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            console.log(`❌ Auth Middleware: Token verification failed for ${req.path}: ${err.message}`);
            if (err.name === 'TokenExpiredError') {
                console.log('⏰ Token specifically expired at:', err.expiredAt);
            }
            return res.status(401).json({ success: false, message: 'Invalid or expired token' });
        }

        // First, try to find in Driver collection
        const Driver = require('../models/Driver');
        const driver = await Driver.findById(decoded.id).select('-password');

        if (driver) {
            // User is a driver in Driver collection
            console.log('✅ Auth Middleware: Authenticated as driver:', driver.name);
            req.user = driver;
            req.user.userType = 'driver'; // Ensure userType is set
            req.user.role = 'driver'; // Ensure role is set
            return next();
        }

        // If not found in Driver collection, check User collection
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            console.log('❌ Auth Middleware: User not found in DB');
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        console.log('✅ Auth Middleware: Authenticated as user:', user.name);

        // Attach user to request object
        req.user = user;
        req.user.userType = 'user';
        next();
    } catch (error) {
        console.error('❌ Auth Middleware Critical Error:', error);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Authentication error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Middleware to check if user is a driver
const requireDriver = (req, res, next) => {
    if (req.user.userType !== 'driver') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Driver privileges required.'
        });
    }
    next();
};

// Middleware to check if user is a regular user
const requireUser = (req, res, next) => {
    if (req.user.userType !== 'user') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. User privileges required.'
        });
    }
    next();
};

module.exports = {
    authenticateToken,
    requireDriver,
    requireUser
};
