/**
 * db.js — Smart Database Connection
 *
 * Strategy:
 * 1. If MONGODB_URI is a real connection string → try Atlas.
 * 2. If Atlas fails OR URI is a placeholder → start a local in-memory MongoDB.
 *
 * The MongoMemoryServer binary is cached in %LOCALAPPDATA%/mongodb-binaries
 * so it only downloads once.
 */

const mongoose = require('mongoose');
const os = require('os');
const path = require('path');

// Set binary download path BEFORE importing MongoMemoryServer
// This avoids Windows permission errors on first-time downloads
const BINARY_DIR = path.join(os.homedir(), 'AppData', 'Local', 'mongodb-binaries');
process.env['MONGOMS_DOWNLOAD_DIR'] = BINARY_DIR;
process.env['MONGOMS_PREFER_GLOBAL_PATH'] = '1';

function isRealUri(uri) {
    if (!uri) return false;
    if (/[<>]/.test(uri)) return false;              // placeholders like <username>
    if (/your_|YOUR_/i.test(uri)) return false;      // "your_password" style placeholders
    if (!uri.includes('@') && !uri.includes('localhost')) return false;
    return true;
}

async function startMemoryServer() {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    console.log('🧪 Starting in-process MongoDB (first run downloads binary ~50MB)...');

    const mongod = await MongoMemoryServer.create({
        instance: {
            dbName: 'car_rental',
            port: 27777,              // fixed port so re-use is possible
        },
        binary: {
            downloadDir: BINARY_DIR,
            version: '6.0.14',       // Pin a known LTS version
        },
    });

    const uri = mongod.getUri();
    console.log(`✅ In-process MongoDB ready → ${uri}`);
    return uri;
}

async function connectDB() {
    const opts = {
        family: 4,
        serverSelectionTimeoutMS: 8000,
    };

    const rawUri = process.env.MONGODB_URI;

    // ── Try Atlas first ──────────────────────────────────────────────────
    if (isRealUri(rawUri)) {
        console.log('🌐 Connecting to MongoDB Atlas...');
        try {
            await mongoose.connect(rawUri, opts);
            console.log('✅ MongoDB Atlas connected!');

            mongoose.connection.on('disconnected', () => console.log('⚠️  Atlas disconnected'));
            mongoose.connection.on('error', (e) => console.error('❌ Atlas error:', e.message));
            return;
        } catch (err) {
            console.error(`❌ Atlas failed: ${err.message}`);
            console.log('⚠️  Falling back to in-memory MongoDB...');
        }
    } else {
        if (rawUri) {
            console.warn('⚠️  MONGODB_URI looks like a placeholder — using in-memory DB.');
        } else {
            console.warn('⚠️  No MONGODB_URI found — using in-memory DB.');
        }
    }

    // ── In-memory fallback ───────────────────────────────────────────────
    try {
        const uri = await startMemoryServer();
        await mongoose.connect(uri, { ...opts, serverSelectionTimeoutMS: 15000 });
        console.log('✅ Connected to local in-memory MongoDB ✓');
        console.log('   ➜ Data resets on server restart.');
        console.log('   ➜ Add a valid MONGODB_URI in server/.env to persist data.');

        mongoose.connection.on('disconnected', () => console.log('⚠️  In-mem DB disconnected'));
        mongoose.connection.on('error', (e) => console.error('❌ In-mem DB error:', e.message));
    } catch (err) {
        console.error('❌ In-memory MongoDB failed:', err.message);
        console.warn('⚠️  Running without DB — all data routes will error until MongoDB is configured.');
    }
}

module.exports = { connectDB };
