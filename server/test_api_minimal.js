const axios = require('axios');

const API_BASE_URL = 'http://localhost:4000/api';
const TOKEN = ''; // I don't have a token, but I can check if the server is up and what it says

async function test() {
    try {
        console.log('--- TESTING API ---');
        // Test health check
        const health = await axios.get('http://localhost:4000/');
        console.log('Health:', health.data);

        // Test available drivers (without token, should get 401)
        try {
            const drivers = await axios.get('http://localhost:4000/api/booking/drivers/available?latitude=14.6819&longitude=77.6006&rideType=bike');
            console.log('Drivers:', drivers.data);
        } catch (err) {
            console.log('Drivers Error (expected if not logged in):', err.response?.status, err.response?.data);
        }
    } catch (err) {
        console.error('Connection Error:', err.message);
    }
}
test();
