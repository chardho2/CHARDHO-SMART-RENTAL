const rateLimit = require('express-rate-limit');

// Environment-aware configuration
const isDevelopment = process.env.NODE_ENV !== 'production';

// Rate limiter for login endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 20 : 5, // Dev: 20, Prod: 5 requests
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for registration endpoints (more lenient)
const registrationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 50 : 10, // Dev: 50, Prod: 10 requests
    message: {
        success: false,
        message: 'Too many registration attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for general API endpoints
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 500, // Limit each IP to 500 requests per minute
    message: {
        success: false,
        message: 'Too many requests. Please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for location search (external API calls)
const searchLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit to 30 searches per minute
    message: {
        success: false,
        message: 'Too many search requests. Please wait a moment.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limiter for booking creation
const bookingLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // Limit to 10 bookings per 5 minutes
    message: {
        success: false,
        message: 'Too many booking attempts. Please wait a few minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    authLimiter,
    registrationLimiter,
    apiLimiter,
    searchLimiter,
    bookingLimiter
};
