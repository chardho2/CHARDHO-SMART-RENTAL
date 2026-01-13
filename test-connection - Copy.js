
const io = require('socket.io-client');

const socket = io('http://localhost:4001', {
    transports: ['websocket', 'polling'], // Try both
    reconnectionRequests: 1
});

console.log('Attempting to connect to http://localhost:4001...');

socket.on('connect', () => {
    console.log('✅ SUCCESS: Connected to server!');
    process.exit(0);
});

socket.on('connect_error', (err) => {
    console.log('❌ ERROR: Connection failed:', err.message);
    process.exit(1);
});

// Timeout
setTimeout(() => {
    console.log('❌ ERROR: Timeout waiting for connection');
    process.exit(1);
}, 5000);
