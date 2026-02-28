const fallbackLocations = [
    // ========== VISAKHAPATNAM DISTRICT ==========
    { name: 'Visakhapatnam Railway Station', address: 'Dwaraka Nagar, Visakhapatnam', city: 'Visakhapatnam', lat: 17.7042, lng: 83.2978 },
    { name: 'Vizag Airport', address: 'Visakhapatnam Airport', city: 'Visakhapatnam', lat: 17.7211, lng: 83.2245 },
    { name: 'Dwaraka Bus Stand', address: 'Dwaraka Nagar, Visakhapatnam', city: 'Visakhapatnam', lat: 17.7068, lng: 83.3015 },

    // ========== ANANTAPUR DISTRICT ==========
    { name: 'Anantapur Railway Station', address: 'Railway Station Road, Anantapur', city: 'Anantapur', lat: 14.6819, lng: 77.6006 },
    { name: 'Anantapur Bus Stand', address: 'Bus Stand Road, Anantapur', city: 'Anantapur', lat: 14.6833, lng: 77.6000 },
    { name: 'Hindupur', address: 'Hindupur, Anantapur', city: 'Hindupur', lat: 13.8333, lng: 77.4833 },
    { name: 'Guntakal', address: 'Guntakal, Anantapur', city: 'Guntakal', lat: 15.1667, lng: 77.3667 },
    { name: 'Dharmavaram', address: 'Dharmavaram, Anantapur', city: 'Dharmavaram', lat: 14.4167, lng: 77.7167 },
    { name: 'Tadipatri', address: 'Tadipatri, Anantapur', city: 'Tadipatri', lat: 14.9000, lng: 78.0167 },
    { name: 'Gooty', address: 'Gooty, Anantapur', city: 'Gooty', lat: 15.1167, lng: 77.6333 },
    { name: 'Penukonda', address: 'Penukonda, Anantapur', city: 'Penukonda', lat: 14.0833, lng: 77.6000 }
];

function testSearch(query) {
    console.log(`\nTesting search for: "${query}"`);
    const searchRegex = new RegExp(query, 'i');
    const matches = fallbackLocations.filter(loc =>
        searchRegex.test(loc.name) || searchRegex.test(loc.address) || searchRegex.test(loc.city)
    );

    console.log(`Found ${matches.length} matches:`);
    matches.forEach(m => console.log(` - ${m.name} (${m.address})`));
    return matches.length > 0;
}

// Test cases
testSearch('Anantapur');
testSearch('anant');
testSearch('Visakha');
testSearch('XYZNonExistent');
