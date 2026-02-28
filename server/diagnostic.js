const fs = require('fs');
const log = (msg) => {
    fs.appendFileSync('diagnostic.log', msg + '\n');
    console.log(msg);
};

log('1. Starting diagnostic...');
try {
    require('dotenv').config({ path: __dirname + '/.env' });
    log('2. Dotenv loaded. PORT=' + process.env.PORT);
} catch (e) { log('Error loading dotenv: ' + e.message); }

try {
    const express = require('express');
    const app = express();
    log('3. Express initialized');

    const http = require('http');
    const server = http.createServer(app);
    log('4. HTTP server created');

    const PORT = process.env.PORT || 4000;

    server.listen(PORT, '0.0.0.0', () => {
        log('5. Server SUCCESS! Listening on ' + PORT);
    });

    server.on('error', (e) => {
        log('SERVER ERROR: ' + e.message);
    });

} catch (e) {
    log('CRITICAL ERROR: ' + e.message + '\n' + e.stack);
}
