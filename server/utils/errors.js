// Custom error classes for better error handling

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message = 'Validation failed') {
        super(message, 400);
        this.name = 'ValidationError';
    }
}

class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401);
        this.name = 'AuthenticationError';
    }
}

class AuthorizationError extends AppError {
    constructor(message = 'You do not have permission to perform this action') {
        super(message, 403);
        this.name = 'AuthorizationError';
    }
}

class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
        this.name = 'NotFoundError';
    }
}

class ConflictError extends AppError {
    constructor(message = 'Resource already exists') {
        super(message, 409);
        this.name = 'ConflictError';
    }
}

class RateLimitError extends AppError {
    constructor(message = 'Too many requests, please try again later') {
        super(message, 429);
        this.name = 'RateLimitError';
    }
}

class DatabaseError extends AppError {
    constructor(message = 'Database operation failed') {
        super(message, 500);
        this.name = 'DatabaseError';
    }
}

class ExternalServiceError extends AppError {
    constructor(service = 'External service', message = 'Service unavailable') {
        super(`${service}: ${message}`, 503);
        this.name = 'ExternalServiceError';
    }
}

// Error response formatter
const formatErrorResponse = (err, includeStack = false) => {
    const response = {
        success: false,
        status: err.status || 'error',
        message: err.message || 'An error occurred'
    };

    if (includeStack && err.stack) {
        response.stack = err.stack;
    }

    if (err.errors) {
        response.errors = err.errors;
    }

    return response;
};

// Async error wrapper to catch errors in async route handlers
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Handle specific error types
const handleCastError = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new ValidationError(message);
};

const handleDuplicateFieldsError = (err) => {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    const message = `${field} '${value}' already exists`;
    return new ConflictError(message);
};

const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data: ${errors.join('. ')}`;
    return new ValidationError(message);
};

const handleJWTError = () => {
    return new AuthenticationError('Invalid token, please login again');
};

const handleJWTExpiredError = () => {
    return new AuthenticationError('Your session has expired, please login again');
};

module.exports = {
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    DatabaseError,
    ExternalServiceError,
    formatErrorResponse,
    catchAsync,
    handleCastError,
    handleDuplicateFieldsError,
    handleValidationError,
    handleJWTError,
    handleJWTExpiredError
};
