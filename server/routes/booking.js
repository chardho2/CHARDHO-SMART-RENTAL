const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Driver = require('../models/Driver');
const User = require('../models/User');
const Location = require('../models/Location');
const RecentSearch = require('../models/RecentSearch');
const { authenticateToken } = require('../middleware/auth');
const NotificationService = require('../services/notificationService');
const { searchLimiter, bookingLimiter } = require('../middleware/rateLimiter');

// Debug endpoint to check socket status
router.get('/debug/socket-status', authenticateToken, async (req, res) => {
    try {
        const { getConnectedDriversList, debugSocketRooms } = require('../socket');

        const drivers = getConnectedDriversList();

        // Capture console output
        const originalLog = console.log;
        let debugOutput = '';
        console.log = (...args) => {
            debugOutput += args.join(' ') + '\n';
        };

        debugSocketRooms();

        // Restore console.log
        console.log = originalLog;

        res.json({
            success: true,
            connectedDrivers: drivers,
            debugOutput: debugOutput,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Cache for popular locations (5 minutes TTL)
const popularLocationsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// @route   GET /api/booking/locations/popular
// @desc    Get popular locations
// @access  Public
router.get('/locations/popular', async (req, res) => {
    console.log('📍 GET /api/booking/locations/popular requested');
    try {
        const { city, latitude, longitude } = req.query;

        // Create cache key
        const cacheKey = `${city || 'all'}_${latitude || 'none'}_${longitude || 'none'}`;

        // Check cache first
        const cached = popularLocationsCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            console.log('✅ Returning cached popular locations');
            return res.json(cached.data);
        }

        let query = { isActive: true };
        query.type = 'popular';

        // Filter by city if provided (and not 'India')
        if (city && city !== 'All' && city !== 'India') {
            query.city = new RegExp(city, 'i');
        }

        let locations = await Location.find(query).sort({ searchCount: -1 }).limit(20);

        // Geofencing: If we have user coordinates, filter out DB results that are too far away (> 20km)
        // This prevents showing "Anantapur City" locations when user is in "Dharmavaram" (same district but far)
        if (latitude && longitude && locations.length > 0) {
            const userLat = parseFloat(latitude);
            const userLon = parseFloat(longitude);

            locations = locations.filter(loc => {
                if (!loc.coordinates || !loc.coordinates.latitude) return true; // Keep if no coords (safe)

                const dist = Math.sqrt(
                    Math.pow(loc.coordinates.latitude - userLat, 2) +
                    Math.pow(loc.coordinates.longitude - userLon, 2)
                ) * 111; // Rough km conversion

                return dist < 20; // 20km radius max for "Popular"
            });
        }

        // Trim back to 10 after filter
        locations = locations.slice(0, 10);

        // If local DB has insufficient data after filtering, fetch dynamic popular places from external API
        if (locations.length < 5) {
            console.log(`⚠️ Low local data for ${city || 'current location'}, fetching from external API...`);

            try {
                const axios = require('axios');
                const nominatimUrl = 'https://nominatim.openstreetmap.org/search';

                // Construct a query for major landmarks in the area
                // e.g., "railway station near Dharmavaram" or "bus station in Bangalore"
                // We'll search for generic "transport" and "amenity" types nearby

                const searchQueries = [
                    `railway station ${city !== 'India' ? city : ''}`,
                    `bus station ${city !== 'India' ? city : ''}`,
                    `market ${city !== 'India' ? city : ''}`,
                    `hospital ${city !== 'India' ? city : ''}`
                ];

                // If we have coords, we can search "near" them effectively
                // But Nominatim 'q' param is easiest. Let's try the city-based approach first.

                const params = {
                    format: 'json',
                    addressdetails: 1,
                    limit: 4,
                    countrycodes: 'in'
                };

                // Add viewbox if coords exist to bias results significantly
                if (latitude && longitude) {
                    const lat = parseFloat(latitude);
                    const lon = parseFloat(longitude);
                    const delta = 0.05; // ~5km radius for "Popular Nearby"
                    params.viewbox = `${lon - delta},${lat + delta},${lon + delta},${lat - delta}`;
                    params.bounded = 1; // Strictly bounded for "nearby" feeling
                }

                // Execute a few searches to populate list
                // We'll just run one generic "important places" search logic or parallel requests
                // Simplifying: Search for specific categories around the user

                // Strategy: Search for "bus station", "railway station", "center"
                const promises = searchQueries.map(q =>
                    axios.get(nominatimUrl, {
                        params: { ...params, q: q },
                        headers: { 'User-Agent': 'CharDhoGo-RideApp/1.0' },
                        timeout: 5000 // 5 second timeout for external API
                    }).catch(e => ({ data: [] }))
                );

                const results = await Promise.all(promises);
                const externalLocations = results.flatMap(r => r.data).map(place => {
                    // Clean address similar to search route
                    const address = place.address;
                    const parts = [];
                    if (address.road) parts.push(address.road);
                    if (address.suburb) parts.push(address.suburb);
                    if (address.city || address.town || address.village) parts.push(address.city || address.town || address.village);

                    return {
                        _id: `ext_${place.place_id}`,
                        name: place.display_name.split(',')[0],
                        address: parts.join(', ') || place.display_name,
                        city: address.city || address.town || address.village || '',
                        coordinates: {
                            latitude: parseFloat(place.lat),
                            longitude: parseFloat(place.lon)
                        },
                        type: 'popular',
                        isDynamic: true
                    };
                });

                // Dedup and merge
                const seen = new Set(locations.map(l => l.name));
                for (const ext of externalLocations) {
                    if (!seen.has(ext.name)) {
                        locations.push(ext);
                        seen.add(ext.name);
                    }
                    if (locations.length >= 10) break;
                }

            } catch (extError) {
                console.error("External API fetch failed:", extError.message);
            }
        }

        // Cache the result
        popularLocationsCache.set(cacheKey, {
            data: locations,
            timestamp: Date.now()
        });

        // Clean up old cache entries (simple cleanup)
        if (popularLocationsCache.size > 100) {
            const entries = Array.from(popularLocationsCache.entries());
            entries.slice(0, 50).forEach(([key]) => popularLocationsCache.delete(key));
        }

        res.json(locations);
    } catch (error) {
        console.error('Error fetching popular locations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/booking/locations/search
// @desc    Search locations across India using OpenStreetMap Nominatim
// @access  Public
router.get('/locations/search', searchLimiter, async (req, res) => {
    try {
        const { query, latitude, longitude } = req.query;
        if (!query || query.length < 2) return res.json([]);

        console.log('🔍 Searching locations for:', query);

        // Use OpenStreetMap Nominatim API (free, no API key needed)
        const axios = require('axios');

        const nominatimUrl = 'https://nominatim.openstreetmap.org/search';
        const params = {
            q: query,
            format: 'json',
            addressdetails: 1,
            limit: 10,
            countrycodes: 'in', // Restrict to India
            'accept-language': 'en'
        };

        // Add viewbox for location-biased results if user location is available
        if (latitude && longitude) {
            // Create a bounding box around user's location (roughly 50km radius) to prioritize local results
            const lat = parseFloat(latitude);
            const lon = parseFloat(longitude);
            const delta = 0.5; // ~55km
            params.viewbox = `${lon - delta},${lat + delta},${lon + delta},${lat - delta}`;
            params.bounded = 0; // Prioritize viewbox but don't strictly exclude
        }

        const response = await axios.get(nominatimUrl, {
            params,
            headers: {
                'User-Agent': 'CharDhoGo-RideApp/1.0' // Required by Nominatim
            }
        });

        console.log(`✅ Nominatim returned ${response.data.length} results`);

        // Transform Nominatim results to our format
        const locations = response.data.map(place => {
            // Build a clean address
            const address = place.address;
            const parts = [];

            // More granular street/area details
            if (address.road) parts.push(address.road);
            if (address.neighbourhood) parts.push(address.neighbourhood);
            if (address.residential) parts.push(address.residential);
            if (address.suburb) parts.push(address.suburb);

            // City/Town details
            if (address.city || address.town || address.village) {
                parts.push(address.city || address.town || address.village);
            }

            // State details
            if (address.state_district && !parts.includes(address.state_district)) {
                parts.push(address.state_district);
            }
            if (address.state) parts.push(address.state);

            const cleanAddress = parts.join(', ');

            return {
                _id: `nominatim_${place.place_id}`,
                name: place.display_name.split(',')[0], // First part is usually the main name
                address: cleanAddress || place.display_name,
                city: address.city || address.town || address.village || address.state_district || '',
                state: address.state || '',
                coordinates: {
                    latitude: parseFloat(place.lat),
                    longitude: parseFloat(place.lon)
                },
                type: place.type || 'location',
                placeId: place.place_id
            };
        });

        // Also search in our database for saved locations
        const searchRegex = new RegExp(query, 'i');
        const dbLocations = await Location.find({
            $or: [
                { name: searchRegex },
                { address: searchRegex },
                { city: searchRegex }
            ],
            isActive: true
        }).limit(5);

        // Merge results - prioritize DB locations (they're verified)
        const combined = [...dbLocations, ...locations];

        // Remove duplicates based on coordinates proximity
        const unique = [];
        const seen = new Set();

        for (const loc of combined) {
            const key = `${Math.round(loc.coordinates.latitude * 1000)},${Math.round(loc.coordinates.longitude * 1000)}`; // Increased precision for dedupe
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(loc);
            }
        }

        console.log(`📍 Returning ${unique.length} unique locations`);
        res.json(unique.slice(0, 15));
    } catch (error) {
        console.error('❌ Error searching locations:', error.message);
        // Return empty array on error instead of incorrect hardcoded data
        res.json([]);
    }
});

// @route   GET /api/booking/locations/recent
// @desc    Get user's recent searches
// @access  Private
router.get('/locations/recent', authenticateToken, async (req, res) => {
    try {
        const recentSearches = await RecentSearch.find({ user: req.user._id })
            .sort({ searchedAt: -1 })
            .limit(4);

        const locations = recentSearches.map(search => ({
            _id: `recent_${search._id}`,
            name: search.location.name,
            address: search.location.address,
            coordinates: search.location.coordinates,
            type: 'recent'
        }));

        res.json(locations);
    } catch (error) {
        console.error('Error fetching recent searches:', error);
        res.json([]); // Return empty array on error
    }
});

// @route   POST /api/booking/locations/save-recent
// @desc    Save a location to recent searches
// @access  Private
router.post('/locations/save-recent', authenticateToken, async (req, res) => {
    try {
        const { name, address, coordinates } = req.body;

        // Check if this exact location was already searched recently
        const existing = await RecentSearch.findOne({
            user: req.user._id,
            'location.name': name,
            'location.coordinates.latitude': coordinates.latitude,
            'location.coordinates.longitude': coordinates.longitude
        });

        if (existing) {
            // Update the timestamp
            existing.searchedAt = new Date();
            await existing.save();
        } else {
            // Create new recent search
            await RecentSearch.create({
                user: req.user._id,
                location: { name, address, coordinates }
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving recent search:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/booking/estimate-rates
// @desc    Get estimated rates for different ride types
// @access  Private
router.post('/estimate-rates', authenticateToken, async (req, res) => {
    // ... inside estimate-rates route ...
    console.log('🧮 POST /api/booking/estimate-rates hit');
    try {
        const { pickup, destination } = req.body;
        console.log('📦 Input:', {
            pickup: pickup ? { ...pickup, coordinates: '...' } : 'missing',
            destination: destination ? { ...destination, coordinates: '...' } : 'missing'
        });

        if (!pickup || !destination) {
            console.log('❌ Missing coordinates for estimate');
            return res.status(400).json({ message: 'Pickup and destination coordinates required' });
        }

        const lat1 = parseFloat(pickup.latitude || pickup.coordinates?.latitude);
        const lon1 = parseFloat(pickup.longitude || pickup.coordinates?.longitude);
        const lat2 = parseFloat(destination.latitude || destination.coordinates?.latitude);
        const lon2 = parseFloat(destination.longitude || destination.coordinates?.longitude);

        console.log('📍 Coords:', { lat1, lon1, lat2, lon2 });

        if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
            console.log('❌ Invalid coordinates for estimate');
            return res.status(400).json({ message: 'Invalid coordinates provided' });
        }

        // precise calculation
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };

        const distanceKm = calculateDistance(lat1, lon1, lat2, lon2);
        let distanceVal = parseFloat(distanceKm.toFixed(2)); // nice number
        if (isNaN(distanceVal)) distanceVal = 0;

        console.log('📏 Distance:', distanceVal);

        // Pricing Configuration (Could come from DB later)
        const pricing = {
            bike: { base: 20, perKm: 5, min: 30, speed: 25 },
            auto: { base: 30, perKm: 10, min: 40, speed: 20 },
            car: { base: 50, perKm: 15, min: 80, speed: 30 },
            suv: { base: 80, perKm: 20, min: 120, speed: 30 }
        };

        const rideTypes = [
            { id: "bike", name: "Bike", icon: "motorcycle", seats: 1 },
            { id: "auto", name: "Auto", icon: "local-taxi", seats: 3 },
            { id: "car", name: "Car", icon: "directions-car", seats: 4 },
            { id: "suv", name: "SUV", icon: "airport-shuttle", seats: 6 },
        ];

        const estimates = rideTypes.map(type => {
            const config = pricing[type.id];
            if (!config) throw new Error(`Missing pricing config for ${type.id}`); // Debug check

            const distanceCharge = Math.round(distanceVal * config.perKm);
            const calculatedTotal = config.base + distanceCharge;
            const finalTotal = Math.max(calculatedTotal, config.min);
            const minFareAdjustment = finalTotal - calculatedTotal;
            const timeMin = Math.ceil((distanceVal / config.speed) * 60) + 5;

            return {
                ...type,
                price: finalTotal,
                time: `${timeMin} min`,
                fareBreakdown: {
                    baseFare: config.base,
                    distanceCharge: distanceCharge,
                    minFareAdjustment: minFareAdjustment,
                    total: finalTotal,
                    distance: distanceVal
                }
            };
        });

        res.json({
            success: true,
            distance: distanceVal,
            estimates
        });

    } catch (error) {
        console.error('Error estimating rates:', error);

        try {
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(__dirname, '../booking_debug.log');
            const logEntry = `[${new Date().toISOString()}] ❌ ESTIMATE-ERROR: ${error.message}\nStack: ${error.stack}\nInput Body: ${JSON.stringify(req.body)}\nHeaders: ${JSON.stringify(req.headers)}\n\n`;
            fs.appendFileSync(logPath, logEntry);
        } catch (logError) {
            console.error('Failed to write to debug log:', logError);
        }

        res.status(500).json({ message: 'Error calculating rates' });
    }
});

// @route   GET /api/booking/drivers/available
// @desc    Get available drivers nearby
// @access  Private
router.get('/drivers/available', authenticateToken, async (req, res) => {
    try {
        console.log('🚙 GET /api/booking/drivers/available requested by:', req.user?._id);
        const { latitude, longitude, rideType } = req.query;

        if (!latitude || !longitude) {
            return res.status(400).json({ message: 'Location coordinates required' });
        }

        console.log('🔍 Searching for drivers with params:', { latitude, longitude, rideType });

        // DEEP DEBUG: Log every single driver in the DB to see their actual status
        try {
            const allSystemDrivers = await Driver.find({}).select('name email isOnline vehicle.type');
            console.log(`🔎 SYSTEM SCAN: Total drivers in DB: ${allSystemDrivers.length}`);
            allSystemDrivers.forEach(d => {
                console.log(`   - ${d.name} (${d.email}) | Online: ${d.isOnline} | Type: ${d.vehicle?.type || 'none'}`);
            });
        } catch (e) { console.log('Scan error:', e.message); }

        // EXTREMELY INCLUSIVE QUERY: Find all online drivers
        const query = { isOnline: true };

        // Use Driver model to find online drivers
        const drivers = await Driver.find(query)
            .select('name email phone vehicle rating totalRides location isOnline')
            .limit(20);

        console.log(`✅ Driver Collection: Found ${drivers.length} online:`, drivers.map(d => `${d.name}(${d.vehicle?.type || 'no-type'})`));

        // LEGACY SUPPORT
        let legacyDrivers = [];
        try {
            const legacyOnline = await User.find({ isOnline: true }).select('name email');
            console.log(`✅ User Collection: ${legacyOnline.length} online total:`, legacyOnline.map(u => u.name));

            legacyDrivers = await User.find({ isOnline: true })
                .select('name email phone vehicle rating totalRides location isOnline role userType')
                .limit(10);
        } catch (err) {
            console.warn('⚠️ Legacy error:', err.message);
        }

        // Merge drivers, avoiding duplicates
        const allDrivers = [...drivers];
        const existingEmails = new Set(drivers.map(d => d.email?.toLowerCase()));

        for (const ld of legacyDrivers) {
            if (!existingEmails.has(ld.email?.toLowerCase())) {
                allDrivers.push(ld);
                existingEmails.add(ld.email?.toLowerCase());
            }
        }

        // In-memory filter for rideType (optional/soft)
        let filteredDrivers = allDrivers;
        if (rideType && rideType !== 'all') {
            const regex = new RegExp(`^${rideType}$`, 'i');
            filteredDrivers = allDrivers.filter(d =>
                !d.vehicle?.type || regex.test(d.vehicle.type)
            );
        }

        console.log(`📊 Total online: ${allDrivers.length} | Matches '${rideType}': ${filteredDrivers.length}`);

        // If even filtered list is empty, but we have ANY online drivers, show all of them as fallback
        const finalDrivers = filteredDrivers.length > 0 ? filteredDrivers : allDrivers;

        if (finalDrivers.length === 0) {
            console.log('⚠️ ABSOLUTELY NO ONE IS ONLINE');
            return res.json([]);
        }

        // Helper function to calculate distance using Haversine formula
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371; // Earth's radius in km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c; // Distance in km
        };

        // Calculate real distance and ETA for each driver
        const driversWithDistance = finalDrivers.map(driver => {
            let distance, eta;

            if (!driver.name) return null;

            // Check if driver has location data
            if (driver.location?.latitude && driver.location?.longitude) {
                const distanceKm = calculateDistance(
                    parseFloat(latitude),
                    parseFloat(longitude),
                    driver.location.latitude,
                    driver.location.longitude
                );

                distance = distanceKm.toFixed(1);

                const avgSpeed = {
                    'bike': 25,
                    'auto': 20,
                    'car': 30,
                    'suv': 30
                }[driver.vehicle?.type] || 25;

                eta = Math.ceil((distanceKm / avgSpeed) * 60);
            } else {
                // FALLBACK: If driver is online but has no GPS yet, show them with a minimal distance
                distance = "0.5";
                eta = "2";
                console.log(`  ⚠️ ${driver.name}: Online but no GPS yet, showing as fallback`);
            }

            return {
                id: driver._id,
                name: driver.name,
                rating: driver.rating || 0,
                vehicle: driver.vehicle?.model || 'Generic Vehicle',
                vehicleType: driver.vehicle?.type || 'bike',
                vehicleColor: driver.vehicle?.color || 'N/A',
                plate: driver.vehicle?.plateNumber || 'N/A',
                distance: `${distance} km`,
                eta: `${eta} min`,
                phone: driver.phone,
                totalRides: driver.totalRides || 0,
                hasLocation: !!(driver.location?.latitude && driver.location?.longitude),
                isVerified: driver.isVerified || false
            };
        }).filter(driver => driver !== null);

        // Sort by distance
        driversWithDistance.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

        res.json(driversWithDistance.slice(0, 10));
    } catch (error) {
        console.error('❌ Available drivers error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/booking/create
// @desc    Create a new booking
// @access  Private
router.post('/create', authenticateToken, bookingLimiter, async (req, res) => {
    const fs = require('fs');
    const path = require('path');
    const logFile = path.join(__dirname, '../booking_debug.log');
    const log = (msg) => {
        const time = new Date().toISOString();
        try {
            fs.appendFileSync(logFile, `[${time}] ${msg}\n`);
        } catch (e) { }
        console.log(msg);
    };

    try {
        log('📝 POST /api/booking/create requested');
        // log(`📦 Request body: ${JSON.stringify(req.body)}`); // Avoiding potential large output logs

        const { pickup, destination, rideType, fare, estimatedTime, driverId } = req.body;

        // Basic Validation
        if (!pickup || !destination || !rideType || !fare) {
            log('❌ Missing required fields in booking request');
            return res.status(400).json({ success: false, message: 'Missing required booking data' });
        }

        if (!driverId) {
            log('❌ Missing driverId in booking request');
            return res.status(400).json({ success: false, message: 'Driver selection is required' });
        }

        // Verify driver is available (check both collections for safety during migration)
        let driver = await Driver.findById(driverId);
        if (!driver) {
            // Check User collection as fallback for legacy drivers
            driver = await User.findById(driverId);
        }

        if (!driver) {
            log(`❌ Driver not found: ${driverId}`);
            return res.status(400).json({ success: false, message: 'Selected driver not found' });
        }

        // Ensure driver is online
        if (!driver.isOnline) {
            log(`❌ Driver ${driver.name} is offline`);
            // We'll allow it for now if testing, but return a warning in the response if needed
        }

        // Prepare the booking object with explicit casting and defaults
        const bookingData = {
            user: req.user._id,
            driver: driverId,
            pickup: {
                name: pickup.name || 'Unknown',
                address: pickup.address || 'No address',
                coordinates: {
                    latitude: Number(pickup.coordinates?.latitude || pickup.lat || 0),
                    longitude: Number(pickup.coordinates?.longitude || pickup.lng || 0)
                }
            },
            destination: {
                name: destination.name || 'Unknown',
                address: destination.address || 'No address',
                coordinates: {
                    latitude: Number(destination.coordinates?.latitude || destination.lat || 0),
                    longitude: Number(destination.coordinates?.longitude || destination.lng || 0)
                }
            },
            rideType: {
                id: rideType.id || 'bike',
                name: rideType.name || 'Bike',
                icon: rideType.icon || 'two-wheeler',
                basePrice: Number(rideType.basePrice || rideType.price || 0)
            },
            fare: {
                baseFare: Number(fare.baseFare || 0),
                distanceCharge: Number(fare.distanceCharge || 0),
                total: Number(fare.total || 0),
                distance: Number(fare.distance || req.body.distance || 0)
            },
            estimatedTime: Number(estimatedTime || 15),
            status: 'pending',
            payment: {
                method: req.body.payment?.method || 'cash',
                status: 'pending'
            }
        };

        log('💾 Creating booking instance...');
        const booking = new Booking(bookingData);

        log('💾 Saving booking...');
        await booking.save();
        log(`✅ Booking saved successfully: ${booking._id}`);

        // Notify driver via socket
        try {
            log(`🔌 Notifying driver via socket... ${driverId}`);
            const { emitNewBooking, getIO } = require('../socket');

            const io = getIO();

            const bookingForSocket = booking.toObject();
            bookingForSocket.user = {
                _id: req.user._id,
                name: req.user.name,
                phone: req.user.phone
            };

            emitNewBooking(bookingForSocket, [driverId]);
            log(`✅ Socket notification sent to driver ${driverId}`);

            // NEW: Create persistent notification for URL history
            await NotificationService.notifyUser(io, req.user._id, {
                title: 'Ride Requested',
                message: `Searching for driver... (Booking #${booking._id.toString().slice(-6)})`,
                type: 'ride_request',
                category: 'ride',
                priority: 'medium',
                actionUrl: '/booking/searching',
                metadata: { bookingId: booking._id }
            });

            // Also notify driver persistently
            await NotificationService.notifyDriverRideRequest(io, driverId, {
                bookingId: booking._id,
                pickupAddress: booking.pickup.address,
                destinationAddress: booking.destination.address,
                pickup: booking.pickup,
                destination: booking.destination,
                estimatedFare: booking.fare.total,
                fare: booking.fare, // Pass full object too
                distance: booking.fare.distance
            });
            log(`✅ Persistent notification created for driver ${driverId}`);

        } catch (e) {
            log(`⚠️ Socket/Notification failed: ${e.message}`);
        }

        res.status(201).json({ success: true, booking });
    } catch (error) {
        const msg = `❌ Booking confirmation error: ${error.message}\n${error.stack}`;
        try {
            const fs = require('fs');
            const path = require('path');
            fs.appendFileSync(path.join(__dirname, '../booking_debug.log'), `[${new Date().toISOString()}] ${msg}\n`);
        } catch (e) { }
        console.error(msg);
        res.status(500).json({
            success: false,
            message: 'Booking failed',
            error: error.message
        });
    }
});

// @route   GET /api/booking/my-bookings
// @desc    Get user's bookings with pagination and filtering
// @access  Private
router.get('/my-bookings', authenticateToken, async (req, res) => {
    try {
        const { status, limit = 10, page = 1 } = req.query;

        const query = { user: req.user._id };
        if (status && status !== 'all') {
            query.status = status;
        }

        const bookings = await Booking.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .populate('driver', 'name phone vehicle rating');

        const total = await Booking.countDocuments(query);

        res.json({
            success: true,
            bookings,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get my bookings error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/booking/driver-bookings
// @desc    Get driver's bookings (trips) with pagination and filtering
// @access  Private (Driver)
router.get('/driver-bookings', authenticateToken, async (req, res) => {
    try {
        console.log('🚙 GET /driver-bookings requested by:', req.user._id);
        const { status, limit = 10, page = 1 } = req.query;

        console.log('Query params:', { status, limit, page });

        const query = { driver: req.user._id };
        if (status && status !== 'all') {
            query.status = status;
        }

        console.log('Mongo Query:', JSON.stringify(query));

        const limitNum = parseInt(limit) || 10;
        const pageNum = parseInt(page) || 1;

        const bookings = await Booking.find(query)
            .sort({ createdAt: -1 })
            .limit(limitNum)
            .skip((pageNum - 1) * limitNum)
            .populate('user', 'name phone profilePicture rating');

        console.log(`Found ${bookings.length} bookings`);

        const total = await Booking.countDocuments(query);

        res.json({
            success: true,
            bookings,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('❌ Get driver bookings error:', error);
        console.error(error.stack);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET /api/booking/history
// @desc    Get user booking history
// @access  Private
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const rides = await Booking.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('driver', 'name vehicle phone');
        res.json({ success: true, rides });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});

// @route   GET /api/booking/:id
// @desc    Get booking details
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('driver', 'name email phone vehicle rating')
            .populate('user', 'name phone profileImage');
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        res.json({ success: true, booking });
    } catch (e) {
        console.error(`❌ GET /booking/${req.params.id} error:`, e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// @route   PATCH /api/booking/:id/accept
// @desc    Accept a booking
// @access  Private (Driver)
router.patch('/:id/accept', authenticateToken, async (req, res) => {
    try {
        console.log(`👍 Accept booking requested: ${req.params.id} by driver ${req.user._id}`);

        // Generate 4-digit PIN
        const pin = Math.floor(1000 + Math.random() * 9000).toString();

        // Atomic update: Only update if status is 'pending'
        const booking = await Booking.findOneAndUpdate(
            { _id: req.params.id, status: 'pending' },
            {
                $set: {
                    status: 'accepted',
                    driver: req.user._id,
                    verificationPin: pin,
                    otpAttempts: 0
                }
            },
            { new: true }
        );

        if (!booking) {
            // Check why it failed
            const existing = await Booking.findById(req.params.id);
            if (!existing) return res.status(404).json({ success: false, message: 'Booking not found' });

            // IDEMPOTENCY CHECK: If already accepted by THIS driver, return success
            if (existing.status === 'accepted' && existing.driver && existing.driver.toString() === req.user._id.toString()) {
                console.log(`ℹ️ Booking ${req.params.id} already accepted by this driver. Returning success.`);
                return res.json({ success: true, booking: existing, message: 'Ride already accepted' });
            }

            console.log(`⚠️ Conflict: Booking ${req.params.id} is ${existing.status} (Driver: ${existing.driver})`);
            return res.status(409).json({ success: false, message: 'Booking is already ' + existing.status });
        }

        // startTime is set when PIN is verified, not when accepted
        // booking.startTime = new Date(); 

        console.log(`✅ Booking ${booking._id} accepted by ${req.user.name}`);

        // Notify user via socket and persistent notification
        try {
            const { notifyUser } = require('../socket');
            notifyUser(booking.user, 'booking:accepted', {
                bookingId: booking._id,
                driverId: req.user._id,
                verificationPin: pin, // Send PIN to user immediately
                driver: {
                    name: req.user.name,
                    phone: req.user.phone,
                    vehicle: req.user.vehicle?.model,
                    plate: req.user.vehicle?.plateNumber,
                    photo: req.user.profilePicture
                },
                message: 'Driver accepted your ride request'
            });

            // Persistent Notification
            const io = require('../socket').getIO();
            const NotificationService = require('../services/notificationService');
            await NotificationService.notifyRideStatus(io, booking.user.toString(), 'accepted', {
                bookingId: booking._id,
                driverName: req.user.name,
                driverId: req.user._id,
                verificationPin: pin
            });
        } catch (notifyError) {
            console.error('Notification error in accept:', notifyError.message);
        }

        res.json({ success: true, booking });
    } catch (e) {
        console.error('Accept error:', e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// @route   PATCH /api/booking/:id/reject
// @desc    Reject a booking
// @access  Private (Driver)
router.patch('/:id/reject', authenticateToken, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Graceful handling of race conditions
        if (booking.status === 'cancelled') {
            console.log(`ℹ️ Booking ${req.params.id} already cancelled when driver tried to reject.`);
            return res.json({ success: true, message: 'Ride was already cancelled' });
        }

        if (booking.status !== 'pending') {
            const msg = `Booking already ${booking.status}`;
            console.log(`⚠️ Reject failed: ${msg}`);
            return res.status(409).json({ success: false, message: msg });
        }

        booking.status = 'cancelled';
        booking.cancelledBy = req.user._id;
        booking.cancelledAt = new Date();
        booking.cancellationReason = 'Driver rejected the request';
        await booking.save();

        // Notify user via socket
        try {
            const { notifyUser } = require('../socket');
            const userId = booking.user._id ? booking.user._id.toString() : booking.user.toString();

            notifyUser(userId, 'booking:rejected', {
                bookingId: booking._id,
                message: 'Driver declined. Please book again.',
                driverId: req.user._id,
                action: 'retry'
            });

            // Persistent notification
            const io = require('../socket').getIO();
            const NotificationService = require('../services/notificationService'); // Ensure loaded
            if (NotificationService && NotificationService.notifyRideStatus) {
                await NotificationService.notifyRideStatus(io, userId, 'cancelled', {
                    bookingId: booking._id,
                    cancelReason: 'Driver declined',
                    driverName: 'Driver'
                });
            }

        } catch (e) {
            console.error('Socket notification error during rejection:', e.message);
        }

        res.json({ success: true, message: 'Booking rejected successfully' });
    } catch (e) {
        console.error("Reject error:", e);
        res.status(500).json({ success: false, message: e.message });
    }
});

// @route   POST /api/booking/verify-pin
// @route   POST /api/booking/verify-pin
// @desc    Verify ride start PIN
// @access  Private (Driver)
router.post('/verify-pin', authenticateToken, async (req, res) => {
    try {
        const { bookingId, pin } = req.body;
        console.log(`🔐 PIN Verification Request:`, {
            bookingId,
            receivedPin: pin,
            pinType: typeof pin,
            pinLength: pin?.length
        });

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            console.log('❌ Booking not found:', bookingId);
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        console.log(`📋 Booking Details:`, {
            bookingId: booking._id,
            status: booking.status,
            storedPin: booking.verificationPin,
            storedPinType: typeof booking.verificationPin,
            storedPinLength: booking.verificationPin?.length,
            otpAttempts: booking.otpAttempts
        });

        // Security Check: Rate limiting (3 attempts)
        if (booking.otpAttempts >= 3) {
            console.log('❌ Too many failed attempts for booking:', bookingId);
            return res.status(429).json({ success: false, message: 'Too many failed attempts. Ride locked.' });
        }

        // Normalize both PINs to strings and trim whitespace
        const normalizedReceivedPin = String(pin).trim();
        const normalizedStoredPin = String(booking.verificationPin).trim();

        console.log(`🔍 PIN Comparison:`, {
            received: normalizedReceivedPin,
            stored: normalizedStoredPin,
            match: normalizedReceivedPin === normalizedStoredPin
        });

        if (normalizedStoredPin !== normalizedReceivedPin) {
            booking.otpAttempts += 1;
            await booking.save();

            console.log(`❌ PIN Mismatch! Attempts: ${booking.otpAttempts}/3`);
            console.log(`   Expected: "${normalizedStoredPin}"`);
            console.log(`   Received: "${normalizedReceivedPin}"`);

            return res.status(400).json({
                success: false,
                message: `Incorrect PIN. ${3 - booking.otpAttempts} attempts remaining.`
            });
        }

        // Success
        console.log('✅ PIN Verified Successfully!');
        booking.status = 'in_progress';
        booking.startTime = new Date();
        await booking.save();

        // Notify User
        const { notifyUser, getIO } = require('../socket');
        notifyUser(booking.user, 'ride:started', {
            bookingId: booking._id,
            startTime: booking.startTime,
            message: 'Ride started successfully'
        });

        // Persistent Notification
        const io = getIO();
        const NotificationService = require('../services/notificationService');
        await NotificationService.notifyRideStatus(io, booking.user.toString(), 'started', {
            bookingId: booking._id,
            driverName: req.user.name,
            destinationName: booking.destination.name
        });

        res.json({ success: true, message: 'PIN verified. Ride started.' });

    } catch (error) {
        console.error('❌ PIN verification error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});



// @route   PATCH /api/booking/:id/arrived
// @desc    Driver arrived at pickup
// @access  Private (Driver)
router.patch('/:id/arrived', authenticateToken, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

        if (booking.status !== 'accepted') {
            return res.status(400).json({ success: false, message: 'Booking must be accepted first' });
        }

        booking.status = 'driver_arrived';
        await booking.save();

        // Notify User
        const { notifyUser, getIO } = require('../socket');
        notifyUser(booking.user, 'driver:arrived', {
            bookingId: booking._id,
            message: 'Driver has arrived at pickup location'
        });

        // Persistent Notification
        const io = getIO();
        const NotificationService = require('../services/notificationService');
        await NotificationService.notifyRideStatus(io, booking.user.toString(), 'arrived', { // Ensure 'arrived' type exists in Service or map to 'info'
            bookingId: booking._id,
            driverName: req.user.name
        });

        res.json({ success: true, booking });
    } catch (e) { res.status(500).json({ success: false, message: e.message }); }
});



// @route   POST /api/booking/:id/cancel
// @desc    Cancel a booking
// @access  Private
router.post('/:id/cancel', authenticateToken, async (req, res) => {
    try {
        console.log(`🛑 Cancel booking requested for: ${req.params.id} by user: ${req.user._id}`);
        const { reason } = req.body;

        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Verify ownership (User or Driver can cancel technically, but this route is primarily for User cancellation flow)
        if (booking.user.toString() !== req.user._id.toString() && booking.driver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
        }

        if (booking.status === 'completed' || booking.status === 'cancelled') {
            return res.status(400).json({ success: false, message: `Booking is already ${booking.status}` });
        }

        // Update status
        booking.status = 'cancelled';
        booking.cancelledBy = req.user._id;
        booking.cancellationReason = reason || 'User cancelled';
        booking.endTime = new Date();
        await booking.save();

        console.log('✅ Booking cancelled successfully');

        // Notify the other party
        const { notifyUser, notifyDriver } = require('../socket'); // Ensure to import notifyDriver if not already imported up top or use socket directly

        // If user cancelled, notify driver
        if (booking.user.toString() === req.user._id.toString()) {
            if (booking.driver) {
                // We need to notify the driver
                // Use socket.io directly or a helper
                // Assuming notifyDriver helper exists or we can reuse existing logic
                // If not, we can assume notifyDriver works similarly to notifyUser but targets driver room
                // If notifyDriver doesn't exist, we might need to check socket implementation.
                // safe fallback:
                try {
                    const io = require('../socket').getIO();
                    if (io) {
                        // Standardize the room name to match how drivers connect ('driver:ID')
                        const driverRoom = `driver:${booking.driver}`;
                        console.log(`📡 Attempting to notify driver in room: ${driverRoom}`);

                        io.to(driverRoom).emit('booking:cancelled', {
                            bookingId: booking._id,
                            message: 'User has cancelled the ride'
                        });
                        console.log(`✅ Notified driver ${booking.driver} of cancellation`);
                    }
                } catch (err) {
                    console.log('Socket notify error', err.message);
                }
            }
        } else {
            // Driver cancelled
            try {
                const io = require('../socket').getIO();
                if (io) {
                    io.to(`user:${booking.user}`).emit('booking:cancelled', {
                        bookingId: booking._id,
                        message: 'Driver has cancelled the ride'
                    });
                }
            } catch (err) { }
        }

        // Persistent Notification for Cancellation
        const io = require('../socket').getIO();
        const NotificationService = require('../services/notificationService');

        const recipientId = booking.user.toString() === req.user._id.toString() ? booking.driver : booking.user;
        const recipientType = booking.user.toString() === req.user._id.toString() ? 'driver' : 'user';

        if (recipientId) {
            if (recipientType === 'driver') {
                // Notify Driver with specific message
                await NotificationService.notifyDriverRideStatus(io, recipientId.toString(), 'cancelled', {
                    bookingId: booking._id,
                    cancelReason: reason || 'User cancelled'
                });
            } else {
                // Notify User
                await NotificationService.notifyRideStatus(io, recipientId.toString(), 'cancelled', {
                    bookingId: booking._id,
                    cancelReason: reason || 'Driver cancelled',
                    driverName: 'Driver'
                });
            }
        }

        res.json({ success: true, message: 'Booking cancelled successfully' });
    } catch (error) {
        console.error('❌ Cancel booking error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   PATCH /api/booking/:id/complete
// @desc    Complete a booking
// @access  Private (Driver)
router.patch('/:id/complete', authenticateToken, async (req, res) => {
    try {
        console.log(`🏁 Complete booking requested for: ${req.params.id} by driver: ${req.user._id}`);

        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // 1. Verify Driver
        if (booking.driver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to complete this booking' });
        }

        if (booking.status === 'completed') {
            return res.json({ success: true, booking, message: 'Already completed' });
        }

        // ⭐ PAYMENT VERIFICATION: Check if online payment was actually received
        if (booking.payment && booking.payment.method !== 'cash' && booking.payment.status !== 'completed') {
            console.log(`⚠️  Online payment detected - verifying payment status...`);

            const phonePeService = require('../services/phonePeService');

            // Check if transaction ID exists
            if (!booking.payment.transactionId) {
                console.log(`❌ No transaction ID - payment not initiated`);
                return res.status(400).json({
                    success: false,
                    verified: false,
                    message: 'User has not completed the online payment',
                    suggestion: 'Please ask the user to pay via cash instead',
                    action: 'SWITCH_TO_CASH',
                    canComplete: false
                });
            }

            // Online payment verification removed.
            if (booking.payment.method !== 'cash' && booking.payment.status !== 'completed') {
                console.log(`💳 Online payment (${booking.payment.method}) detected. Skipping automatic verification.`);
                // You can manually mark as completed or wait for manual confirmation
            }

        }

        // 2. Update Booking
        booking.status = 'completed';
        booking.endTime = new Date();

        if (!booking.payment) {
            booking.payment = { method: 'cash', status: 'pending' };
        }
        if (booking.payment.method === 'cash') {
            booking.payment.status = 'completed';
        }
        // For online payments, status remains 'pending' until webhook callbacks

        await booking.save();
        console.log('✅ Booking marked as completed');

        // 3. Financial Settlement & Stats Update (NEW WALLET SYSTEM V2)
        const payoutService = require('../services/payoutService');
        // walletServiceV2 is imported but only used for cash/stats here
        const cashReconciliationService = require('../services/cashReconciliationService');

        // Calculate earnings split (70/30)
        const { commission, driverEarnings } = payoutService.calculateEarnings(booking.fare.total);

        // Process wallet transactions based on payment method
        if (booking.payment.method === 'cash') {
            // CASH PAYMENT - Use cash reconciliation service
            console.log('💵 Processing CASH payment with reconciliation...');
            const walletResult = await cashReconciliationService.processCashRideWithDues({
                driverId: booking.driver,
                userId: booking.user,
                bookingId: booking._id,
                totalFare: booking.fare.total,
                commission: commission,
                driverEarning: driverEarnings
            });
            console.log(`✅ Cash ride processed | Commission: ${walletResult.commissionDeducted ? 'DEDUCTED' : 'PENDING'}`);
        } else {
            // ONLINE PAYMENT (UPI/PhonePe/Card)
            // ⚠️ DO NOT CREDIT WALLET HERE! 
            // Wait for Payment Gateway Webhook (server/routes/payment.js) to confirm success.
            console.log('💳 Online payment: Waiting for gateway confirmation before crediting wallet...');
        }

        // Store earnings for stats update
        const earnings = { commission, driverEarnings };

        try {
            const driverUpdate = {
                $inc: {
                    totalRides: 1,
                    totalEarnings: earnings.driverEarnings // NET Earnings
                },
                $set: {
                    isOnline: true // Ensure they are marked online/available
                }
            };

            // If we have current location in body (passed from frontend), update it
            if (req.body.location) {
                driverUpdate.$set['location'] = {
                    latitude: req.body.location.latitude,
                    longitude: req.body.location.longitude,
                    lastUpdated: new Date()
                };
            }

            await Driver.findByIdAndUpdate(req.user._id, driverUpdate);
            console.log('✅ Driver stats updated with NET earnings');

        } catch (driverError) {
            console.error('⚠️ Failed to update driver stats:', driverError.message);
            // Don't fail the request, just log it
        }

        // 4. Notify User & Driver
        try {
            const { getIO, notifyUser } = require('../socket');
            const io = getIO();
            const NotificationService = require('../services/notificationService');

            // Notify User (Socket + Persistent)
            notifyUser(booking.user, 'booking:completed', {
                bookingId: booking._id,
                fare: booking.fare.total,
                message: 'Ride completed'
            });

            await NotificationService.notifyRideStatus(io, booking.user.toString(), 'completed', {
                bookingId: booking._id,
                fare: booking.fare.total,
                driverName: req.user.name
            });

            // Notify Driver about Earnings (Net)
            await NotificationService.notifyPayment(io, req.user._id, 'driver', {
                success: true,
                amount: earnings.driverEarnings, // Driver sees Net Amount
                bookingId: booking._id
            });
            console.log('✅ Driver notified about NET earnings');


            console.log('✅ User notified via persistent service for completion');
        } catch (e) {
            console.error('Socket/Notification error:', e.message);
        }

        res.json({ success: true, booking });
    } catch (error) {
        console.error('❌ Complete booking error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   POST /api/booking/:id/rate
// @desc    Rate a driver after ride completion
// @access  Private (User)
router.post('/:id/rate', authenticateToken, async (req, res) => {
    try {
        const { rating, feedback } = req.body;
        const bookingId = req.params.id;

        console.log(`⭐ Rating request for booking ${bookingId}: ${rating} stars`);

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        // Find the booking
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Verify the user owns this booking
        if (booking.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to rate this booking'
            });
        }

        // Check if booking is completed
        if (booking.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Can only rate completed rides'
            });
        }

        // Check if already rated
        if (booking.rating) {
            return res.status(400).json({
                success: false,
                message: 'This ride has already been rated'
            });
        }

        // Update booking with rating
        booking.rating = rating;
        booking.feedback = feedback || '';
        booking.ratedAt = new Date();
        await booking.save();

        console.log(`✅ Booking ${bookingId} rated: ${rating} stars`);

        // Update driver's overall rating
        try {
            const driverId = booking.driver;
            console.log(`📊 Updating rating for driver: ${driverId}`);

            // Try Driver collection first
            let driver = await Driver.findById(driverId);
            if (!driver) {
                // Fallback to User collection for legacy drivers
                driver = await User.findById(driverId);
                console.log(`⚠️ Driver found in User collection (legacy)`);
            }

            if (driver) {
                console.log(`📊 Current driver stats - Rating: ${driver.rating}, Total Ratings: ${driver.totalRatings || 0}`);

                // Calculate new rating using weighted average
                const currentRating = driver.rating || 0;
                const totalRatings = driver.totalRatings || 0;

                // New average = (old_avg * old_count + new_rating) / (old_count + 1)
                const newRating = ((currentRating * totalRatings) + rating) / (totalRatings + 1);

                driver.rating = Math.round(newRating * 10) / 10; // Round to 1 decimal
                driver.totalRatings = totalRatings + 1;

                console.log(`📊 New driver stats - Rating: ${driver.rating}, Total Ratings: ${driver.totalRatings}`);
                console.log(`💾 Saving driver document...`);

                await driver.save();

                console.log(`✅ Driver ${driver.name} rating updated successfully: ${driver.rating} (${driver.totalRatings} ratings)`);
            } else {
                console.warn(`⚠️ Driver ${driverId} not found in either Driver or User collection`);
            }
        } catch (driverError) {
            console.error('⚠️ Failed to update driver rating:', driverError.message);
            console.error('Stack trace:', driverError.stack);
            // Don't fail the request, rating is saved in booking
        }

        res.json({
            success: true,
            message: 'Rating submitted successfully',
            booking
        });
    } catch (error) {
        console.error('❌ Rating submission error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * SWITCH PAYMENT METHOD TO CASH
 * @route   POST /api/booking/:id/switch-to-cash
 * @desc    Switch payment method from online to cash
 */
router.post('/:id/switch-to-cash', authenticateToken, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        // Check if driver owns this booking
        if (booking.driver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        // Check if previously paid (double charge prevention)
        if (booking.payment.status === 'completed' && booking.payment.method === 'cash') {
            return res.json({ success: true, booking, message: 'Payment already collected' });
        }

        // Store old info
        const oldMethod = booking.payment.method;

        // Update to cash & completed
        booking.payment = {
            method: 'cash',
            status: 'completed',
            transactionId: null,
            previousMethod: oldMethod,
            switchedAt: new Date()
        };

        // Ensure booking status is completed if it wasn't
        if (booking.status !== 'completed') {
            booking.status = 'completed';
            booking.endTime = new Date();
        }

        await booking.save();

        // FINANCIAL RECONCILIATION
        const payoutService = require('../services/payoutService');
        const cashReconciliationService = require('../services/cashReconciliationService');

        // Calculate earnings split (70/30)
        const { commission, driverEarnings } = payoutService.calculateEarnings(booking.fare.total);

        console.log('💵 Processing SWITCH-TO-CASH payment with reconciliation...');

        // Process cash ride (Credit earnings check, Debit commission)
        const walletResult = await cashReconciliationService.processCashRideWithDues({
            driverId: booking.driver,
            userId: booking.user,
            bookingId: booking._id,
            totalFare: booking.fare.total,
            commission: commission,
            driverEarning: driverEarnings
        });

        console.log(`✅ Cash ride processed | Commission: ${walletResult.commissionDeducted ? 'DEDUCTED' : 'PENDING'}`);

        // Update Driver Stats
        try {
            await Driver.findByIdAndUpdate(req.user._id, {
                $inc: {
                    totalRides: 1,
                    totalEarnings: driverEarnings
                },
                $set: { isOnline: true }
            });
        } catch (e) {
            console.error('Failed to update driver stats', e);
        }

        // Notify user via socket
        try {
            const { getIO, notifyUser } = require('../socket');
            const NotificationService = require('../services/notificationService');
            const io = getIO();

            if (io) {
                // Specific event for payment method change
                io.to(`user_${booking.user}`).emit('payment:method-changed', {
                    bookingId: booking._id,
                    newMethod: 'cash',
                    oldMethod
                });

                // Also standard completion event
                notifyUser(booking.user, 'booking:completed', {
                    bookingId: booking._id,
                    fare: booking.fare.total,
                    message: 'Ride completed (Cash Payment)'
                });
            }

            await NotificationService.notifyPayment(io, req.user._id, 'driver', {
                success: true,
                amount: driverEarnings,
                bookingId: booking._id,
                message: 'Cash payment collected (Commission deducted)'
            });

        } catch (socketError) {
            console.log('⚠️ Socket notification failed');
        }

        res.json({ success: true, booking, message: 'Payment collected via Cash' });

    } catch (error) {
        console.error('❌ Switch to cash error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});



module.exports = router;

