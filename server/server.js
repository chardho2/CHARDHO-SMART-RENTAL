require('dotenv').config({ path: __dirname + '/.env' });
const { connectDB } = require('./db');


const express = require('express');
const dns = require('dns');

// Force Node.js to use Google DNS to resolve MongoDB SRV records
// This bypasses local ISP DNS blocks/issues
dns.setServers(['8.8.8.8', '8.8.4.4']);

const cors = require('cors');
const cookieParser = require('cookie-parser');
const os = require('os');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
// CORS configuration for cookies
const defaultAllowedOrigins = [
    'http://localhost:19006',
    'http://localhost:8081',
    'http://localhost:8000',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:19006',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:8000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'exp://192.168.0.103:8081', // Update with your IP
    'exp://10.81.145.87:8081'   // Update with your IP
];

const configuredOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : defaultAllowedOrigins;

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('exp://')) {
            return callback(null, true);
        }
        return callback(new Error('CORS origin not allowed'));
    },
    credentials: true, // Enable credentials (cookies, authorization headers)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser()); // Parse cookies
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express.urlencoded({ extended: true }));

// Security middleware
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const { apiLimiter } = require('./middleware/rateLimiter');

// Serve static files (For Razorpay Compliance Website)
app.use(express.static(path.join(__dirname, 'public')));

// Set security HTTP headers
app.use(helmet());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Apply general rate limiting to all routes
app.use('/api/', apiLimiter);

// Connect to MongoDB (Atlas → in-memory fallback)
connectDB();

// Basic route - Serve landing page for Razorpay compliance
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// JSON API Status (available at /api/status)
app.get('/api/status', (req, res) => {
    res.json({
        message: 'Welcome to the Chardhogo Backend API',
        status: 'running',
        now: new Date().toISOString(),
        uptime_seconds: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Lightweight health endpoint for UI and infra checks
app.get('/api/health', (req, res) => {
    res.status(200).json({
        ok: true,
        service: 'chardhogo-backend',
        timestamp: new Date().toISOString()
    });
});

// Public config for web clients
app.get('/api/public/config', (req, res) => {
    res.json({
        brand: 'CHARDHO',
        api_base: `http://localhost:${PORT}`,
        support_email: process.env.SUPPORT_EMAIL || 'support@chardho.com',
        features: {
            live_tracking: true,
            wallet: true,
            driver_portal: true
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

// Payment routes
app.use('/api/payment', require('./routes/payment'));

// Wallet routes (V2 - Real-time wallet system)
const walletV2Routes = require('./routes/walletV2');
app.use('/api/wallet', walletV2Routes);


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
