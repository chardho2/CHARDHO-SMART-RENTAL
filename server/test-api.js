// Test file for Chardhogo Backend API
// You can run this with: node test-api.js

const API_BASE_URL = 'http://localhost:4000/api/auth';

// Test data
const testUser = {
    name: 'Test User',
    email: 'testuser@example.com',
    phone: '1234567890',
    password: 'password123',
    userType: 'user'
};

const testDriver = {
    name: 'Test Driver',
    email: 'testdriver@example.com',
    phone: '9876543210',
    password: 'password123',
    userType: 'driver'
};

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();
        return { status: response.status, data: result };
    } catch (error) {
        console.error('API call failed:', error.message);
        return { status: 0, error: error.message };
    }
}

// Test functions
async function testRegisterUser() {
    console.log('\n📝 Testing User Registration...');
    const result = await apiCall('/register', 'POST', testUser);
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return result;
}

async function testRegisterDriver() {
    console.log('\n📝 Testing Driver Registration...');
    const result = await apiCall('/register', 'POST', testDriver);
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return result;
}

async function testLogin(email, password) {
    console.log('\n🔐 Testing Login...');
    const result = await apiCall('/login', 'POST', { email, password });
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return result;
}

async function testGetUser(userId) {
    console.log('\n👤 Testing Get User...');
    const result = await apiCall(`/user/${userId}`, 'GET');
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
    return result;
}

async function testInvalidRegistration() {
    console.log('\n❌ Testing Invalid Registration (missing fields)...');
    const result = await apiCall('/register', 'POST', { email: 'test@test.com' });
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
}

async function testInvalidLogin() {
    console.log('\n❌ Testing Invalid Login (wrong password)...');
    const result = await apiCall('/login', 'POST', {
        email: testUser.email,
        password: 'wrongpassword'
    });
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
}

async function testDuplicateRegistration() {
    console.log('\n❌ Testing Duplicate Registration...');
    const result = await apiCall('/register', 'POST', testUser);
    console.log('Status:', result.status);
    console.log('Response:', JSON.stringify(result.data, null, 2));
}

// Run all tests
async function runTests() {
    console.log('🚀 Starting Chardhogo Backend API Tests');
    console.log('='.repeat(50));

    try {
        // Test 1: Register a user
        const registerResult = await testRegisterUser();
        const userId = registerResult.data?.user?._id;

        // Test 2: Register a driver
        await testRegisterDriver();

        // Test 3: Login with valid credentials
        await testLogin(testUser.email, testUser.password);

        // Test 4: Get user by ID
        if (userId) {
            await testGetUser(userId);
        }

        // Test 5: Invalid registration
        await testInvalidRegistration();

        // Test 6: Invalid login
        await testInvalidLogin();

        // Test 7: Duplicate registration
        await testDuplicateRegistration();

        console.log('\n' + '='.repeat(50));
        console.log('✅ All tests completed!');
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
    }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
    console.error('❌ This script requires Node.js 18+ or you need to install node-fetch');
    console.log('Install node-fetch: npm install node-fetch');
    process.exit(1);
}

// Run tests
runTests();
