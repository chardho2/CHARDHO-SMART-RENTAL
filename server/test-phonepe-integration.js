require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const phonePeService = require('../services/phonePeService');

// Test PhonePe Integration
async function testPhonePe() {
    console.log('\n🧪 Testing PhonePe Integration\n');
    console.log('='.repeat(50));

    try {
        // Test 1: Payment Initiation
        console.log('\n📝 Test 1: Payment Initiation');
        const paymentResult = await phonePeService.initiatePayment({
            amount: 30,
            userId: 'TEST_USER_123',
            bookingId: 'TEST_BOOKING_456',
            userPhone: '9999999999'
        });

        console.log('✅ Payment initiated successfully');
        console.log('   Transaction ID:', paymentResult.merchantTransactionId);
        console.log('   Response:', JSON.stringify(paymentResult.data, null, 2));

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('   Details:', error.response?.data || error);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✓ Test completed\n');
}

// Run test
testPhonePe();
