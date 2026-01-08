require('dotenv').config();
const mongoose = require('mongoose');
const Location = require('./models/Location');

const sampleLocations = [
    {
        name: "Connaught Place",
        address: "CP, Central Delhi",
        city: "New Delhi",
        coordinates: { latitude: 28.6315, longitude: 77.2167 },
        type: "popular",
        category: "landmark",
        searchCount: 1000
    },
    {
        name: "India Gate",
        address: "Rajpath, New Delhi",
        city: "New Delhi",
        coordinates: { latitude: 28.6129, longitude: 77.2295 },
        type: "popular",
        category: "landmark",
        searchCount: 950
    },
    {
        name: "Qutub Minar",
        address: "Mehrauli, South Delhi",
        city: "New Delhi",
        coordinates: { latitude: 28.5244, longitude: 77.1855 },
        type: "popular",
        category: "landmark",
        searchCount: 800
    },
    {
        name: "Red Fort",
        address: "Chandni Chowk, Old Delhi",
        city: "New Delhi",
        coordinates: { latitude: 28.6562, longitude: 77.2410 },
        type: "popular",
        category: "landmark",
        searchCount: 850
    },
    {
        name: "Lotus Temple",
        address: "Kalkaji, South Delhi",
        city: "New Delhi",
        coordinates: { latitude: 28.5535, longitude: 77.2588 },
        type: "popular",
        category: "landmark",
        searchCount: 700
    },
    {
        name: "Akshardham Temple",
        address: "Noida Mor, East Delhi",
        city: "New Delhi",
        coordinates: { latitude: 28.6127, longitude: 77.2773 },
        type: "popular",
        category: "landmark",
        searchCount: 750
    },
    {
        name: "Indira Gandhi International Airport",
        address: "Terminal 3, New Delhi",
        city: "New Delhi",
        coordinates: { latitude: 28.5562, longitude: 77.1000 },
        type: "popular",
        category: "airport",
        searchCount: 1200
    },
    {
        name: "New Delhi Railway Station",
        address: "Paharganj, Central Delhi",
        city: "New Delhi",
        coordinates: { latitude: 28.6431, longitude: 77.2197 },
        type: "popular",
        category: "railway",
        searchCount: 1100
    },
    {
        name: "Rajiv Chowk Metro Station",
        address: "Connaught Place, New Delhi",
        city: "New Delhi",
        coordinates: { latitude: 28.6328, longitude: 77.2197 },
        type: "popular",
        category: "metro",
        searchCount: 900
    },
    {
        name: "Saket Select Citywalk",
        address: "Saket, South Delhi",
        city: "New Delhi",
        coordinates: { latitude: 28.5244, longitude: 77.2066 },
        type: "popular",
        category: "other",
        searchCount: 600
    },
    {
        name: "Cyber Hub",
        address: "DLF Cyber City, Gurugram",
        city: "Gurugram",
        coordinates: { latitude: 28.4950, longitude: 77.0890 },
        type: "popular",
        category: "restaurant",
        searchCount: 650
    },
    {
        name: "Kingdom of Dreams",
        address: "Sector 29, Gurugram",
        city: "Gurugram",
        coordinates: { latitude: 28.4646, longitude: 77.0299 },
        type: "popular",
        category: "other",
        searchCount: 500
    },
    {
        name: "AIIMS Delhi",
        address: "Ansari Nagar, South Delhi",
        city: "New Delhi",
        coordinates: { latitude: 28.5672, longitude: 77.2100 },
        type: "popular",
        category: "hospital",
        searchCount: 800
    },
    {
        name: "Chandni Chowk",
        address: "Old Delhi",
        city: "New Delhi",
        coordinates: { latitude: 28.6506, longitude: 77.2303 },
        type: "popular",
        category: "other",
        searchCount: 700
    },
    {
        name: "Hauz Khas Village",
        address: "Hauz Khas, South Delhi",
        city: "New Delhi",
        coordinates: { latitude: 28.5494, longitude: 77.1932 },
        type: "popular",
        category: "restaurant",
        searchCount: 650
    }
];

async function seedLocations() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing locations
        await Location.deleteMany({});
        console.log('🗑️ Cleared existing locations');

        // Insert sample locations
        await Location.insertMany(sampleLocations);
        console.log(`✅ Inserted ${sampleLocations.length} sample locations`);

        console.log('🎉 Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding error:', error);
        process.exit(1);
    }
}

seedLocations();
