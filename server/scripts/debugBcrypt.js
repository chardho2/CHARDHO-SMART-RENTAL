// Debug bcrypt issue
// Run with: node backend/scripts/debugBcrypt.js

require('dotenv').config({ path: __dirname + '/../.env' });
const bcrypt = require('bcryptjs');

const TEST_PASSWORD = 'NewSecure123!';

async function debugBcrypt() {
    console.log('Testing bcrypt directly...\n');

    console.log('Password to test:', TEST_PASSWORD);
    console.log('Password length:', TEST_PASSWORD.length);
    console.log('Password bytes:', Buffer.from(TEST_PASSWORD).toString('hex'));

    // Test 1: Hash and compare immediately
    console.log('\n=== Test 1: Hash and compare immediately ===');
    const hash1 = await bcrypt.hash(TEST_PASSWORD, 12);
    console.log('Hash:', hash1);
    const match1 = await bcrypt.compare(TEST_PASSWORD, hash1);
    console.log('Match:', match1 ? '✅ YES' : '❌ NO');

    // Test 2: Try with different salt rounds
    console.log('\n=== Test 2: Try with salt rounds 10 ===');
    const hash2 = await bcrypt.hash(TEST_PASSWORD, 10);
    console.log('Hash:', hash2);
    const match2 = await bcrypt.compare(TEST_PASSWORD, hash2);
    console.log('Match:', match2 ? '✅ YES' : '❌ NO');

    // Test 3: Test the exact hash from database
    console.log('\n=== Test 3: Test with database hash ===');
    const dbHash = '$2a$10$yu8tv7CRflcnyFDt01nymeW3/9LgJg0Qnummo5IUMvldSlDqzY2I6';
    console.log('Testing against:', dbHash);
    const match3 = await bcrypt.compare(TEST_PASSWORD, dbHash);
    console.log('Match:', match3 ? '✅ YES' : '❌ NO');

    // Test 4: Try different passwords
    console.log('\n=== Test 4: Try variations ===');
    const variations = [
        'NewSecure123!',
        'newsecure123!',
        'NEWSECURE123!',
        'NewSecure123',
        'NewSecure123! ',
        ' NewSecure123!'
    ];

    for (const pwd of variations) {
        const match = await bcrypt.compare(pwd, dbHash);
        console.log(`"${pwd}":`, match ? '✅ MATCH' : '❌ no match');
    }

    // Test 5: Check bcrypt version
    console.log('\n=== Bcrypt Info ===');
    console.log('bcryptjs version:', require('bcryptjs/package.json').version);
}

debugBcrypt().catch(console.error);
