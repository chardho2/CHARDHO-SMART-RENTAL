const {
    formatErrorResponse,
    handleCastError,
    handleDuplicateFieldsError,
    handleValidationError,
    handleJWTError,
    handleJWTExpiredError
} = require('../utils/errors');

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.statusCode = err.statusCode || 500;
    error.status = err.status || 'error';

    // Log error for debugging
    console.error('❌ ERROR:', {
        name: err.name,
        message: err.message,
        statusCode: error.statusCode,
        path: req.path,
        method: req.method,
        body: req.body,
        user: req.user?.id,
        timestamp: new Date().toISOString()
    });

    // Log stack trace in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Stack:', err.stack);
    }

    // Handle specific error types
    if (err.name === 'CastError') {
        error = handleCastError(err);
    }

    if (err.code === 11000) {
        error = handleDuplicateFieldsError(err);
    }

    if (err.name === 'ValidationError') {
        error = handleValidationError(err);
    }

    if (err.name === 'JsonWebTokenError') {
        error = handleJWTError();
    }

    if (err.name === 'TokenExpiredError') {
        error = handleJWTExpiredError();
    }

    // Send error response
    const response = formatErrorResponse(
        error,
        process.env.NODE_ENV === 'development'
    );

    res.status(error.statusCode).json(response);

    // Log to file in production
    if (process.env.NODE_ENV === 'production') {
        logErrorToFile(err, req);
    }
};

// Log errors to file
const logErrorToFile = (err, req) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const logPath = path.join(__dirname, '..', 'logs', 'errors.log');

        // Ensure logs directory exists
        const logsDir = path.join(__dirname, '..', 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        const logEntry = `
[${new Date().toISOString()}] ❌ ERROR
Name: ${err.name}
Message: ${err.message}
Status: ${err.statusCode || 500}
Path: ${req.method} ${req.path}
User: ${req.user?.id || 'Anonymous'}
Body: ${JSON.stringify(req.body)}
Stack: ${err.stack}
---
`;

        fs.appendFileSync(logPath, logEntry);
    } catch (logError) {
        console.error('Failed to write error log:', logError);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('❌ UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    console.error(err.stack);

    // In production, you might want to gracefully shutdown
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
    console.error(err.name, err.message);
    console.error(err.stack);

    // In production, you must exit
    process.exit(1);
});

module.exports = errorHandler;
