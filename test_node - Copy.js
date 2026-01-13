console.log('Test start');
try {
    const mongoose = require('mongoose');
    console.log('Mongoose required');
} catch (e) {
    console.error('Mongoose require failed', e);
}
