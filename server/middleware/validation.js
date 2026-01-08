const { body, param, query, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// Booking validation rules
const validateBooking = [
    body('pickup').isObject().withMessage('Pickup location is required'),
    body('pickup.name').trim().notEmpty().withMessage('Pickup name is required'),
    body('pickup.address').trim().notEmpty().withMessage('Pickup address is required'),
    body('pickup.coordinates.latitude')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Invalid pickup latitude'),
    body('pickup.coordinates.longitude')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Invalid pickup longitude'),

    body('destination').isObject().withMessage('Destination is required'),
    body('destination.name').trim().notEmpty().withMessage('Destination name is required'),
    body('destination.address').trim().notEmpty().withMessage('Destination address is required'),
    body('destination.coordinates.latitude')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Invalid destination latitude'),
    body('destination.coordinates.longitude')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Invalid destination longitude'),

    body('rideType').isString().withMessage('Ride type is required'),
    validate
];

// Rating validation
const validateRating = [
    param('id').isMongoId().withMessage('Invalid booking ID'),
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),
    body('feedback')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Feedback must be less than 500 characters'),
    validate
];

// User registration validation
const validateUserRegistration = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail(),
    body('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .matches(/^[6-9]\d{9}$/)
        .withMessage('Invalid Indian phone number'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
    validate
];

// Driver registration validation
const validateDriverRegistration = [
    ...validateUserRegistration,
    body('vehicle.type')
        .optional()
        .isIn(['bike', 'auto', 'car', 'suv'])
        .withMessage('Invalid vehicle type'),
    body('vehicle.model')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Vehicle model must be less than 50 characters'),
    body('vehicle.plateNumber')
        .optional()
        .trim()
        .matches(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/)
        .withMessage('Invalid vehicle plate number format'),
    validate
];

// Login validation
const validateLogin = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email format'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
    validate
];

// Location search validation
const validateLocationSearch = [
    query('query')
        .trim()
        .notEmpty()
        .withMessage('Search query is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Query must be between 2 and 100 characters'),
    query('city')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('City name must be less than 50 characters'),
    validate
];

// MongoDB ID validation
const validateMongoId = (paramName = 'id') => [
    param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
    validate
];

// Pagination validation
const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    validate
];

// Driver location update validation
const validateLocationUpdate = [
    body('latitude')
        .isFloat({ min: -90, max: 90 })
        .withMessage('Invalid latitude'),
    body('longitude')
        .isFloat({ min: -180, max: 180 })
        .withMessage('Invalid longitude'),
    body('heading')
        .optional()
        .isFloat({ min: 0, max: 360 })
        .withMessage('Heading must be between 0 and 360'),
    validate
];

// PIN verification validation
const validatePinVerification = [
    param('id').isMongoId().withMessage('Invalid booking ID'),
    body('pin')
        .trim()
        .matches(/^\d{4}$/)
        .withMessage('PIN must be a 4-digit number'),
    validate
];

module.exports = {
    validate,
    validateBooking,
    validateRating,
    validateUserRegistration,
    validateDriverRegistration,
    validateLogin,
    validateLocationSearch,
    validateMongoId,
    validatePagination,
    validateLocationUpdate,
    validatePinVerification
};
