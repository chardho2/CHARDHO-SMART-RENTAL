const fs = require('fs');
const log = (msg) => {
    try { fs.appendFileSync('server_startup.log', new Date().toISOString() + ' ' + msg + '\n'); } catch (e) { }
    console.log(msg);
};

log('STARTING SERVER...');

try {
    require('dotenv').config({ path: __dirname + '/.env' });
    log('1. Dotenv loaded');
} catch (e) { log('Error loading dotenv: ' + e.message); }

const express = require('express');
const mongoose = require('mongoose');
const dns = require('dns');

// Force Node.js to use Google DNS
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    log('2. DNS servers set');
} catch (e) { log('Error setting DNS: ' + e.message); }

const cors = require('cors');
const cookieParser = require('cookie-parser');
const os = require('os');
const app = express();
const PORT = process.env.PORT || 4000;

log('3. Middleware initializing...');
// Middleware setup
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

log('4. Security middleware initializing...');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const { apiLimiter } = require('./middleware/rateLimiter');

app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use('/api/', apiLimiter);

log('5. Connecting to MongoDB...');
// Connect to MongoDB
const mongooseOptions = {
    family: 4,
    serverSelectionTimeoutMS: 5000,
};

mongoose.connect(process.env.MONGODB_URI, mongooseOptions)
    .then(() => {
        log('✅ MongoDB connected successfully');
    })
    .catch(err => {
        log('❌ Initial MongoDB connection error: ' + err.message);
        log('⚠️ Server will continue running without database connection.');
    });

// MongoDB connection event handlers
const db = mongoose.connection;
db.on('disconnected', () => log('⚠️ MongoDB disconnected'));
db.on('error', (err) => log('❌ MongoDB runtime error: ' + err.message));

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Chardhogo Backend API', status: 'running' });
});

log('6. Loading routes...');
try {
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/user', require('./routes/user'));
    app.use('/api/driver', require('./routes/driver'));
    app.use('/api/booking', require('./routes/booking'));
    app.use('/api/stats', require('./routes/stats'));
    app.use('/api/debug', require('./routes/debug'));
    app.use('/api/notifications', require('./routes/notifications'));
    app.use('/api/payment', require('./routes/payment'));
    app.use('/api/wallet', require('./routes/walletV2'));
    log('7. Routes loaded');
} catch (e) {
    log('❌ Error loading routes: ' + e.message + '\n' + e.stack);
}

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
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
    return ips;
}

// Create HTTP server
const http = require('http');
const server = http.createServer(app);

log('8. Initializing Socket.io...');
try {
    const { initializeSocket } = require('./socket');
    initializeSocket(server);
    log('9. Socket.io initialized');
} catch (e) {
    log('❌ Error initializing socket.io: ' + e.message);
}

// Start server
log('10. Starting listener on port ' + PORT);
try {
    server.listen(PORT, '0.0.0.0', () => {
        const networkIPs = getNetworkIPs();
        log(`🚀 Server running on port ${PORT}`);
        log(`📍 API URL: http://localhost:${PORT}`);
        if (networkIPs.length > 0) {
            networkIPs.forEach(ip => {
                log(`   - ${ip.name}: http://${ip.address}:${PORT}`);
            });
        }
    });
} catch (e) {
    log('❌ Error starting listener: ' + e.message);
}
