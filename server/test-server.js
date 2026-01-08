console.log('Testing server startup...');
try {
    require('dotenv').config({ path: __dirname + '/.env' });
    console.log('✅ dotenv loaded');

    const express = require('express');
    console.log('✅ express loaded');

    const mongoose = require('mongoose');
    console.log('✅ mongoose loaded');

    const cors = require('cors');
    console.log('✅ cors loaded');

    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');
    console.log('PORT:', process.env.PORT || 4000);

    console.log('All dependencies loaded successfully!');
} catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
}
