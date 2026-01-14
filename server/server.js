require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const mongoose = require('mongoose');
const dns = require('dns');

// Force Node.js to use Google DNS to resolve MongoDB SRV records
// This bypasses local ISP DNS blocks/issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

const cors = require('cors');
const cookieParser = require('cookie-parser');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
// CORS configuration for cookies
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // List of allowed origins
        const allowedOrigins = [
            'http://localhost:19006',
            'http://localhost:8081',
            'http://127.0.0.1:19006',
            'http://127.0.0.1:8081',
            'exp://192.168.0.103:8081', // Update with your IP
            'exp://10.81.145.87:8081'   // Update with your IP
        ];

        if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('exp://')) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all in development
        }
    },
    credentials: true, // Enable credentials (cookies, authorization headers)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser()); // Parse cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middleware
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const { apiLimiter } = require('./middleware/rateLimiter');

// Set security HTTP headers
app.use(helmet());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Apply general rate limiting to all routes
app.use('/api/', apiLimiter);

// Connect to MongoDB
const mongooseOptions = {
    family: 4, // Force IPv4
    serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30s
};

mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
    .then(() => {
        console.log('✅ MongoDB connected successfully');
    })
    .catch(err => {
        console.error('❌ Initial MongoDB connection error:', err.message);
        if (err.message.includes('ECONNREFUSED')) {
            console.log('💡 TIP: This usually means your DNS is blocking the connection. Try changing your DNS to 8.8.8.8');
        }
        console.log('⚠️ Server will continue running without database connection.');
    });

// MongoDB connection event handlers
const db = mongoose.connection;

db.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected');
});

// The error handler catches post-connection errors
db.on('error', (err) => {
    console.error('❌ MongoDB runtime error:', err);
});
// Basic route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the Chardhogo Backend API',
        status: 'running',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                googleLogin: 'POST /api/auth/google',
                getUser: 'GET /api/auth/user/:id'
            },
            user: {
                profile: 'GET /api/user/profile (Protected)',
                updateProfile: 'PUT /api/user/profile (Protected)',
                rideHistory: 'GET /api/user/rides/history (Protected)',
                deleteAccount: 'DELETE /api/user/account (Protected)'
            },
            driver: {
                profile: 'GET /api/driver/profile (Protected)',
                updateProfile: 'PUT /api/driver/profile (Protected)',
                rideHistory: 'GET /api/driver/rides/history (Protected)',
                stats: 'GET /api/driver/stats (Protected)'
            }
        }
    });
});

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Protected user routes
const userRoutes = require('./routes/user');
app.use('/api/user', userRoutes);

// Protected driver routes
const driverRoutes = require('./routes/driver');
app.use('/api/driver', driverRoutes);

// Booking routes
const bookingRoutes = require('./routes/booking');
app.use('/api/booking', bookingRoutes);

// Stats routes
const statsRoutes = require('./routes/stats');
app.use('/api/stats', statsRoutes);

// Debug routes (for development)
const debugRoutes = require('./routes/debug');
app.use('/api/debug', debugRoutes);

// Notification routes
const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);

// Payment routes (PhonePe)
const paymentRoutes = require('./routes/payment');
app.use('/api/payment', paymentRoutes);

// Wallet routes (V2 - Real-time wallet system)
const walletV2Routes = require('./routes/walletV2');
app.use('/api/wallet', walletV2Routes);

// Payment verification routes (Driver verification before ride completion)
const paymentVerificationRoutes = require('./routes/paymentVerification');
app.use('/api/payment', paymentVerificationRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler (must be last)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

// Function to get all network IPs
function getNetworkIPs() {
    const interfaces = os.networkInterfaces();
    const ips = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                ips.push({ name, address: iface.address });
            }
        }
    }
    return ips; // Return array
}

// Create HTTP server
const http = require('http');
const server = http.createServer(app);

// Initialize Socket.io
const { initializeSocket } = require('./socket');
initializeSocket(server);

// Start server
server.listen(PORT, '0.0.0.0', () => {
    const networkIPs = getNetworkIPs();
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}`);
    console.log(`📱 Available Network URLs:`);
    if (networkIPs.length > 0) {
        networkIPs.forEach(ip => {
            console.log(`   - ${ip.name}: http://${ip.address}:${PORT}`);
        });
    } else {
        console.log(`   - http://localhost:${PORT}`);
    }
    console.log(`🔗 Health check: http://localhost:${PORT}/`);
    console.log(`⚡ Socket.io initialized for real-time communication`);
    console.log(`🔄 Server updated at ${new Date().toISOString()}`);
});
