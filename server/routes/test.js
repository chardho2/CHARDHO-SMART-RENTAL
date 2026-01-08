// Test endpoint to verify server is working
const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Test endpoint working', timestamp: new Date().toISOString() });
});

router.post('/test-estimate', (req, res) => {
    console.log('📦 Test estimate body:', req.body);
    res.json({ success: true, data: req.body });
});

module.exports = router;
