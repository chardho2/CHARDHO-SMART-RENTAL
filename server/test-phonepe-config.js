require('dotenv').config({ path: require('path').join(__dirname, '.env') });

console.log('\n🧪 PhonePe Configuration Test\n');
console.log('='.repeat(50));

// Test environment variables
console.log('\n📋 Environment Variables:');
console.log('  Merchant ID:', process.env.PHONEPE_MERCHANT_ID || '❌ NOT SET');
console.log('  Salt Key:', process.env.PHONEPE_SALT_KEY ? '✅ SET' : '❌ NOT SET');
console.log('  Salt Index:', process.env.PHONEPE_SALT_INDEX || '❌ NOT SET');
console.log('  Callback URL:', process.env.PHONEPE_CALLBACK_URL || '❌ NOT SET');
console.log('  Environment:', process.env.NODE_ENV || 'development');

// Test service loading
console.log('\n📦 Service Loading:');
try {
    const phonePeService = require('./services/phonePeService');
    console.log('  ✅ phonePeService loaded');
    console.log('  ✅ Methods:', Object.keys(phonePeService).join(', '));
} catch (error) {
    console.log('  ❌ Failed to load phonePeService:', error.message);
}

// Test checksum generation
console.log('\n🔐 Checksum Generation Test:');
try {
    const crypto = require('crypto');
    const testPayload = { test: 'data' };
    const base64 = Buffer.from(JSON.stringify(testPayload)).toString('base64');
    const stringToSign = base64 + '/pg/v1/pay' + process.env.PHONEPE_SALT_KEY;
    const sha256 = crypto.createHash('sha256').update(stringToSign).digest('hex');
    const checksum = sha256 + '###' + process.env.PHONEPE_SALT_INDEX;
    console.log('  ✅ Checksum generated:', checksum.substring(0, 20) + '...');
} catch (error) {
    console.log('  ❌ Checksum generation failed:', error.message);
}

console.log('\n' + '='.repeat(50));
console.log('✅ Configuration test complete\n');
