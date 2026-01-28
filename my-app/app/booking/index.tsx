import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
    ActivityIndicator,
    Modal,
    TextInput,
    FlatList
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import BookingHeader from "../../components/booking/BookingHeader";
import LocationSearchModal from "../../components/booking/LocationSearchModal";
import { bookingAPI, LocationData, DriverInfo } from "../../services/bookingAPI";
import { useAuth } from "../../context/AuthContext";
import { notificationService } from "../../services/notificationService";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "../../components/map/MapComponents";
import { isDesktop } from "../../utils/responsive";
import { useSettings } from "../../context/SettingsContext";

const darkMapStyle = [
    {
        "elementType": "geometry",
        "stylers": [{ "color": "#242f3e" }]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#746855" }]
    },
    {
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#242f3e" }]
    },
    {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
    },
    {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [{ "color": "#263c3f" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{ "color": "#38414e" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#212a37" }]
    },
    {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#9ca5b3" }]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [{ "color": "#746855" }]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#17263c" }]
    }
];


const { width, height } = Dimensions.get("window");

// Ride types will be fetched from backend


export default function BookingPage() {
    const { user, isLoading: authLoading } = useAuth();
    const { colors, darkMode } = useSettings();

    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        text: { color: colors.text },
        subText: { color: colors.subText },
        card: { backgroundColor: colors.card, borderColor: colors.border },
        mapPlaceholder: { backgroundColor: colors.card },
        input: { backgroundColor: colors.card, color: colors.text },
        border: { borderColor: colors.border },
    };

    const params = useLocalSearchParams();
    const paramsProcessed = useRef(false);

    const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
    const [destinationLocation, setDestinationLocation] = useState<LocationData | null>(null);

    // Handle Rebooking Parameters
    useEffect(() => {
        if (paramsProcessed.current) return;

        let hasUpdates = false;

        if (params.pickupName && params.pickupLat && params.pickupLng) {
            console.log("Rebooking: Setting Pickup", params.pickupName);
            setPickupLocation({
                name: params.pickupName as string,
                address: params.pickupAddress as string || "",
                coordinates: {
                    latitude: parseFloat(params.pickupLat as string),
                    longitude: parseFloat(params.pickupLng as string),
                }
            });
            hasUpdates = true;
        }
        if (params.dropName && params.dropLat && params.dropLng) {
            console.log("Rebooking: Setting Dropoff", params.dropName);
            setDestinationLocation({
                name: params.dropName as string,
                address: params.dropAddress as string || "",
                coordinates: {
                    latitude: parseFloat(params.dropLat as string),
                    longitude: parseFloat(params.dropLng as string),
                }
            });
            hasUpdates = true;
        }

        if (hasUpdates) {
            paramsProcessed.current = true;
        }
    }, [params]);

    // Dynamic ride types from backend
    const [rideTypes, setRideTypes] = useState<any[]>([]);
    const [selectedRideType, setSelectedRideType] = useState<any>(null);
    const [selectedDriver, setSelectedDriver] = useState<DriverInfo | null>(null);
    const [estimating, setEstimating] = useState(false);

    const [showPickupSearch, setShowPickupSearch] = useState(false);
    const [showDestinationSearch, setShowDestinationSearch] = useState(false);

    const [locations, setLocations] = useState<LocationData[]>([]);
    const [drivers, setDrivers] = useState<DriverInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [driversLoading, setDriversLoading] = useState(false);

    // Location tracking state
    const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
    const [currentCity, setCurrentCity] = useState<string | null>(null);
    const [locationPermission, setLocationPermission] = useState(false);

    const mapRef = useRef<any>(null);

    // Check authentication
    useEffect(() => {
        if (!authLoading && !user) {
            notificationService.confirm(
                'Authentication Required',
                'Please login to book a ride',
                () => router.push('/login/user'),
                () => router.back()
            );
        }
    }, [user, authLoading]);

    // Don't render if not authenticated

    // Request location permission and get current location on mount
    useEffect(() => {
        requestLocationPermission();
    }, []);

    // Fetch estimates when pickup/dest changes
    useEffect(() => {
        if (pickupLocation && destinationLocation) {
            fetchEstimates();
        } else {
            setRideTypes([]);
            setSelectedRideType(null);
        }
    }, [pickupLocation, destinationLocation]);

    // Load drivers when pickup location is set
    useEffect(() => {
        if (pickupLocation) {
            loadAvailableDrivers();
        }
    }, [pickupLocation, selectedRideType]);

    const fetchEstimates = async () => {
        try {
            setEstimating(true);
            const response = await bookingAPI.estimateRates(pickupLocation, destinationLocation);
            if (response.success) {
                setRideTypes(response.estimates);
                // Select first option by default if none selected or if previously selected is not in new list
                if (response.estimates.length > 0) {
                    setSelectedRideType(response.estimates[0]);
                }
            }
        } catch (error) {
            console.error("Error fetching estimates:", error);
            notificationService.error("Could not calculate fares");
        } finally {
            setEstimating(false);
        }
    };

    const requestLocationPermission = async () => {
        try {
            setLoading(true);

            if (Platform.OS === 'web') {
                if (!navigator.geolocation) {
                    notificationService.error('Geolocation Not Supported');
                    await loadPopularLocations();
                    setLoading(false);
                    return;
                }

                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const locationObj = {
                            coords: {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                            },
                            timestamp: position.timestamp,
                        };

                        setCurrentLocation(locationObj as any);
                        setLocationPermission(true);

                        setPickupLocation({
                            id: 'current_location',
                            name: 'Current Location',
                            address: 'Using your browser location',
                            coordinates: {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                            }
                        });

                        // Attempt rudimentary reverse geocoding or fallback
                        await loadPopularLocations();
                        setLoading(false);
                    },
                    async (error) => {
                        notificationService.error('Location Error: ' + error.message);
                        await loadPopularLocations();
                        setLoading(false);
                    }
                );
                return;
            }

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                notificationService.warning('Location permission is required for better experience.');
                await loadPopularLocations();
                setLoading(false);
                return;
            }

            setLocationPermission(true);

            let loc = null;
            try {
                // Try with Balanced accuracy first as High can often fail/timeout on some devices
                loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
            } catch (posError) {
                console.warn("getCurrentPositionAsync failed, trying getLastKnownPositionAsync", posError);
                // Fallback to last known position if current is not available
                loc = await Location.getLastKnownPositionAsync({});
            }

            if (!loc) {
                console.warn("Could not determine location from any source");
                notificationService.info('Could not auto-detect location. Please search manually.');
                await loadPopularLocations();
                setLoading(false);
                return;
            }

            setCurrentLocation(loc);

            let detectedCity = 'India';
            try {
                const reverseGeocoded = await Location.reverseGeocodeAsync({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude
                });

                if (reverseGeocoded.length > 0) {
                    const address = reverseGeocoded[0];
                    console.log("📍 Full Address Obj:", JSON.stringify(address));

                    // Smarter detection for town names
                    detectedCity = address.city || (address.subregion && !address.subregion.includes('District') ? address.subregion : null) || address.subregion || 'India';

                    // Explicit fix for Dharmavaram pincode range if API returns generic District
                    if (address.postalCode && (address.postalCode.startsWith('51567') || address.postalCode.startsWith('5156'))) {
                        detectedCity = 'Dharmavaram';
                    }

                    console.log(`📍 Final Detected City: ${detectedCity}`);
                    setCurrentCity(detectedCity);
                }
            } catch (geoError) {
                console.warn("Reverse geocoding failed", geoError);
            }

            setPickupLocation({
                id: 'current_location',
                name: 'Current Location',
                address: 'Using your current location',
                city: detectedCity,
                coordinates: {
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                }
            });

            await loadPopularLocations(detectedCity, loc.coords.latitude, loc.coords.longitude);
        } catch (error: any) {
            console.error('📍 Location Error:', error);
            notificationService.error('Failed to get location: ' + (error.message || 'Unknown error'));
            await loadPopularLocations();
        } finally {
            setLoading(false);
        }
    };

    const loadPopularLocations = async (city?: string, lat?: number, lng?: number) => {
        try {
            setLoading(true);
            // Use passed args or fallback to state/currentLocation (handling async state updates)
            const targetCity = city || currentCity || 'India';
            const targetLat = lat || currentLocation?.coords.latitude;
            const targetLng = lng || currentLocation?.coords.longitude;

            const data = await bookingAPI.getPopularLocations(
                targetCity,
                targetLat,
                targetLng
            );
            setLocations(data);
        } catch (error) {
            console.error('Error loading locations:', error);
        } finally {
            setLoading(false);
        }
    };

    const lastSearchQuery = useRef<string>("");

    const searchLocations = async (query: string) => {
        lastSearchQuery.current = query;

        if (query.length < 2) {
            // Only revert to popular if we are really clearing the search
            if (query.length === 0) loadPopularLocations();
            return;
        }

        try {
            setLoading(true);
            const data = await bookingAPI.searchLocations(
                query,
                currentLocation?.coords.latitude,
                currentLocation?.coords.longitude
            );

            // Race condition check: Only update if this is still the active query
            if (lastSearchQuery.current === query) {
                setLocations(data);
            }
        } catch (error: any) {
            console.error('Search error:', error);
        } finally {
            if (lastSearchQuery.current === query) {
                setLoading(false);
            }
        }
    };

    const loadAvailableDrivers = async () => {
        if (!pickupLocation || !user) return;

        try {
            setDriversLoading(true);
            const data = await bookingAPI.getAvailableDrivers(
                pickupLocation.coordinates.latitude,
                pickupLocation.coordinates.longitude,
                selectedRideType?.id // drivers specific to ride type?
            );

            setDrivers(data);
            if (data.length === 0) {
                notificationService.info("No drivers available in this area currently.");
            }
            setSelectedDriver(null);
        } catch (error: any) {
            if (error.response?.status === 403 || error.response?.status === 401) {
                console.warn('Session expired while loading drivers');
                notificationService.error("Session expired. Please login again.");
            } else {
                console.error('Error loading drivers:', error);
                notificationService.error("Could not fetch available drivers");
            }
            setDrivers([]);
        } finally {
            setDriversLoading(false);
        }
    };

    // Load recent searches + popular locations
    const loadRecentAndPopularLocations = useCallback(async () => {
        try {
            setLoading(true);

            // Determine search anchor: Pickup Location (if set) > Current Location
            // This ensures that if a user selects "Hindupur", we show locations around Hindupur, not their physical location.
            let anchorLat = currentLocation?.coords.latitude;
            let anchorLng = currentLocation?.coords.longitude;
            let anchorCity = currentCity || 'India';

            if (pickupLocation && pickupLocation.coordinates) {
                anchorLat = pickupLocation.coordinates.latitude;
                anchorLng = pickupLocation.coordinates.longitude;
                // Use pickup city if available, otherwise 'India' to avoid strict city filtering mismatch
                // (e.g. if we are in Dharmavaram but looking at Hindupur coords, passing 'Dharmavaram' would filter out Hindupur results)
                anchorCity = pickupLocation.city || 'India';
            }

            const [recentSearches, popularData] = await Promise.all([
                bookingAPI.getRecentSearches(),
                bookingAPI.getPopularLocations(
                    anchorCity,
                    anchorLat,
                    anchorLng
                )
            ]);

            const combined = [...recentSearches, ...popularData];
            const unique = [];
            const seen = new Set();
            for (const loc of combined) {
                const key = `${loc.name}-${loc.coordinates.latitude.toFixed(4)}-${loc.coordinates.longitude.toFixed(4)}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    unique.push(loc);
                }
            }
            setLocations(unique);
        } catch (error) {
            console.error('Error loading locations:', error);
        } finally {
            setLoading(false);
        }
    }, [currentLocation, currentCity, pickupLocation]);

    useEffect(() => {
        if (showPickupSearch || showDestinationSearch) {
            loadRecentAndPopularLocations();
        }
    }, [showPickupSearch, showDestinationSearch, loadRecentAndPopularLocations]);

    // Calculate estimated fare (Visual helper)
    const getEstimatedFare = () => {
        if (!selectedRideType) return 0;
        return selectedRideType.price;
    };

    const handleBookRide = async () => {
        if (!pickupLocation || !destinationLocation) {
            notificationService.warning('Please select pickup and destination locations');
            return;
        }

        if (!selectedDriver) {
            notificationService.warning('Please select a driver');
            return;
        }

        try {
            setLoading(true);

            // Verify data integrity
            if (!selectedRideType.fareBreakdown) {
                notificationService.error('Invalid fare data. Please re-select ride.');
                return;
            }

            const bookingData = {
                pickup: pickupLocation,
                destination: destinationLocation,
                rideType: selectedRideType,
                fare: selectedRideType.fareBreakdown,
                estimatedTime: parseInt(selectedRideType.time) || 15,
                driverId: selectedDriver.id,
            };

            await AsyncStorage.setItem('pendingBooking', JSON.stringify(bookingData));
            await AsyncStorage.setItem('selectedDriver', JSON.stringify(selectedDriver));

            router.push("/booking/confirm");
        } catch (error: any) {
            notificationService.error(error.response?.data?.message || 'Failed to create booking');
        } finally {
            setLoading(false);
        }
    };

    if (!authLoading && !user) {
        return (
            <SafeAreaView style={[styles.container, dynamicStyles.container]}>
                <BookingHeader title="Book Your Ride" />
                <View style={[styles.loadingContainer, dynamicStyles.container]}>
                    <ActivityIndicator size="large" color="#D0BB95" />
                    <Text style={[styles.loadingText, dynamicStyles.subText]}>Redirecting to login...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (loading && !locations.length) {
        return (
            <SafeAreaView style={[styles.container, dynamicStyles.container]}>
                <BookingHeader title="Book Your Ride" />
                <View style={[styles.loadingContainer, dynamicStyles.container]}>

                    <ActivityIndicator size="large" color="#D0BB95" />
                    <Text style={styles.loadingText}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]}>
            <BookingHeader title="Book Your Ride" />

            {/* Responsive wrapper for desktop */}
            <View style={[styles.content, isDesktop && styles.desktopContent, dynamicStyles.container]}>
                <View style={[styles.innerContent, isDesktop && styles.desktopInnerContent, dynamicStyles.container]}>
                    {/* Map View */}
                    <View style={styles.mapContainer}>
                        {MapView ? (
                            <MapView
                                key={`map-${pickupLocation?.id || 'none'}-${destinationLocation?.id || 'none'}`}
                                ref={mapRef}
                                style={styles.map}
                                customMapStyle={darkMode ? darkMapStyle : []}
                                provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
                                initialRegion={{
                                    latitude: pickupLocation
                                        ? (destinationLocation
                                            ? (pickupLocation.coordinates.latitude + destinationLocation.coordinates.latitude) / 2
                                            : pickupLocation.coordinates.latitude)
                                        : (currentLocation?.coords.latitude || 14.6819),
                                    longitude: pickupLocation
                                        ? (destinationLocation
                                            ? (pickupLocation.coordinates.longitude + destinationLocation.coordinates.longitude) / 2
                                            : pickupLocation.coordinates.longitude)
                                        : (currentLocation?.coords.longitude || 77.6006),
                                    latitudeDelta: 0.05,
                                    longitudeDelta: 0.05,
                                }}
                                showsUserLocation={true}
                                showsMyLocationButton={true}
                            >
                                {/* Pickup Marker - only show if pickup is selected */}
                                {pickupLocation && (
                                    <Marker
                                        coordinate={pickupLocation.coordinates}
                                        title="Pickup"
                                        description={pickupLocation.name}
                                        pinColor="#4CAF50"
                                    />
                                )}

                                {destinationLocation && (
                                    <Marker
                                        coordinate={destinationLocation.coordinates}
                                        title="Destination"
                                        description={destinationLocation.name}
                                        pinColor="#D0BB95"
                                    />
                                )}

                                {destinationLocation && pickupLocation && (
                                    <Polyline
                                        coordinates={[
                                            pickupLocation.coordinates,
                                            destinationLocation.coordinates,
                                        ]}
                                        strokeColor="#D0BB95"
                                        strokeWidth={4}
                                    />
                                )}
                            </MapView>
                        ) : (
                            <View style={styles.mapPlaceholder}>
                                <MaterialIcons name="location-on" size={48} color="#ccc" />
                                <Text style={styles.mapPlaceholderText}>Map not available on web</Text>
                            </View>
                        )}

                        {/* Floating Location Card */}
                        <View style={styles.floatingCard}>
                            {/* Pickup */}
                            <TouchableOpacity
                                style={styles.locationInput}
                                onPress={() => setShowPickupSearch(true)}
                            >
                                <View style={styles.locationDot}>
                                    <View style={[styles.dot, { backgroundColor: "#4CAF50" }]} />
                                </View>
                                <View style={styles.locationText}>
                                    <Text style={styles.locationLabel}>Pickup Location</Text>
                                    <Text style={[
                                        styles.locationValue,
                                        !pickupLocation && { color: '#999', fontStyle: 'italic' }
                                    ]}>
                                        {pickupLocation ? pickupLocation.name : 'Select pickup location'}
                                    </Text>
                                </View>
                                {pickupLocation?.id === 'current_location' && (
                                    <TouchableOpacity
                                        onPress={requestLocationPermission}
                                        style={{ marginRight: 8 }}
                                    >
                                        <MaterialIcons name="my-location" size={20} color="#4CAF50" />
                                    </TouchableOpacity>
                                )}
                                <MaterialIcons name="search" size={20} color="#999" />
                            </TouchableOpacity>

                            {/* Divider */}
                            <View style={styles.locationDivider} />

                            {/* Destination */}
                            <TouchableOpacity
                                style={styles.locationInput}
                                onPress={() => setShowDestinationSearch(true)}
                            >
                                <View style={styles.locationDot}>
                                    <View style={[styles.dot, { backgroundColor: "#D0BB95" }]} />
                                </View>
                                <View style={styles.locationText}>
                                    <Text style={styles.locationLabel}>Destination</Text>
                                    <Text style={[
                                        styles.locationValue,
                                        !destinationLocation && { color: '#999', fontStyle: 'italic' }
                                    ]}>
                                        {destinationLocation ? destinationLocation.name : 'Select destination'}
                                    </Text>
                                </View>
                                <MaterialIcons name="search" size={20} color="#999" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Scrollable Content */}
                    <ScrollView
                        style={[styles.scrollContent, dynamicStyles.container]}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Ride Types */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, dynamicStyles.text]}>Select Ride Type</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.rideTypesContainer}
                            >
                                {estimating ? (
                                    <View style={{ padding: 20 }}>
                                        <ActivityIndicator color="#D0BB95" />
                                        <Text style={{ textAlign: 'center', color: '#666', marginTop: 10 }}>Calculating fares...</Text>
                                    </View>
                                ) : !pickupLocation || !destinationLocation ? (
                                    <View style={{ padding: 20 }}>
                                        <Text style={{ textAlign: 'center', color: '#999' }}>Select pickup and destination to see rides</Text>
                                    </View>
                                ) : (
                                    rideTypes.map((ride) => (
                                        <TouchableOpacity
                                            key={ride.id}
                                            style={[
                                                styles.rideTypeCard,
                                                dynamicStyles.card,
                                                selectedRideType?.id === ride.id && styles.rideTypeCardActive
                                            ]}
                                            onPress={() => setSelectedRideType(ride)}
                                        >
                                            <MaterialIcons
                                                name={ride.icon as any}
                                                size={32}
                                                color={selectedRideType?.id === ride.id ? "#D0BB95" : (darkMode ? "#ccc" : "#666")}
                                            />
                                            <Text style={[
                                                styles.rideTypeName,
                                                dynamicStyles.text,
                                                selectedRideType?.id === ride.id && styles.rideTypeNameActive
                                            ]}>
                                                {ride.name}
                                            </Text>
                                            <Text style={[styles.rideTypePrice, dynamicStyles.text]}>₹{ride.price}</Text>
                                            <Text style={styles.rideTypeTime}>{ride.time}</Text>
                                            <Text style={styles.rideTypeSeats}>{ride.seats} seats</Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </ScrollView>
                        </View>

                        {/* Fare Estimate */}
                        <View style={[styles.fareCard, dynamicStyles.card]}>
                            <View style={styles.fareRow}>
                                <Text style={[styles.fareLabel, dynamicStyles.subText]}>Estimated Fare</Text>
                                <Text style={styles.fareValue}>₹{getEstimatedFare()}</Text>
                            </View>
                            <Text style={[styles.fareNote, dynamicStyles.subText]}>Final fare may vary based on actual distance</Text>
                        </View>

                        {/* Available Drivers */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, dynamicStyles.text]}>Available Drivers Nearby</Text>
                                {!driversLoading && drivers.length > 0 && (
                                    <View style={styles.driverCountBadge}>
                                        <Text style={styles.driverCountText}>{drivers.length} online</Text>
                                    </View>
                                )}
                            </View>
                            {!driversLoading && drivers.length > 0 && !selectedDriver && (
                                <Text style={styles.selectDriverHint}>👆 Tap to select your preferred driver</Text>
                            )}
                            {driversLoading ? (
                                <ActivityIndicator size="small" color="#D0BB95" />
                            ) : !pickupLocation ? (
                                <View style={styles.noDriversContainer}>
                                    <MaterialIcons name="search" size={48} color="#D0BB95" />
                                    <Text style={styles.noDriversText}>Select pickup location to see drivers</Text>
                                    <Text style={styles.noDriversSubtext}>Drivers will appear once you choose where to start</Text>
                                </View>
                            ) : drivers.length === 0 ? (
                                <View style={styles.noDriversContainer}>
                                    <View style={styles.driverSearchingIcon}>
                                        <ActivityIndicator size="large" color="#D0BB95" />
                                    </View>
                                    <Text style={styles.noDriversText}>No drivers online nearby</Text>
                                    <Text style={styles.noDriversSubtext}>Searching for drivers in your area... (Try another ride type)</Text>
                                </View>
                            ) : (
                                drivers.map((driver) => (
                                    <TouchableOpacity
                                        key={driver.id}
                                        style={[
                                            styles.driverCard,
                                            dynamicStyles.card,
                                            selectedDriver?.id === driver.id && styles.driverCardActive
                                        ]}
                                        onPress={() => setSelectedDriver(driver)}
                                    >
                                        <View style={styles.driverAvatar}>
                                            <MaterialIcons name="person" size={28} color="#fff" />
                                        </View>
                                        <View style={styles.driverInfo}>
                                            <Text style={[styles.driverName, dynamicStyles.text]}>{driver.name}</Text>
                                            <View style={styles.driverRating}>
                                                {driver.rating > 0 ? (
                                                    <>
                                                        <MaterialIcons name="star" size={14} color="#FFB800" />
                                                        <Text style={[styles.driverRatingText, dynamicStyles.text]}>
                                                            {driver.rating.toFixed(1)}
                                                        </Text>
                                                        <Text style={[styles.driverRidesText, dynamicStyles.subText]}>
                                                            ({driver.totalRides || 0} rides)
                                                        </Text>
                                                    </>
                                                ) : (
                                                    <Text style={styles.newDriverText}>New Driver</Text>
                                                )}
                                            </View>
                                            <Text style={[styles.driverVehicle, dynamicStyles.subText]}>
                                                {driver.vehicleType?.toUpperCase()} • {driver.vehicle}
                                            </Text>
                                            <Text style={[styles.driverPlate, dynamicStyles.subText]}>{driver.plate}</Text>
                                        </View>
                                        <View style={styles.driverMeta}>
                                            <Text style={[styles.driverDistance, dynamicStyles.subText]}>{driver.distance}</Text>
                                            <Text style={[styles.driverEta, dynamicStyles.subText]}>{driver.eta}</Text>
                                        </View>
                                        {selectedDriver?.id === driver.id && (
                                            <View style={styles.selectedBadge}>
                                                <MaterialIcons name="check-circle" size={24} color="#4CAF50" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                ))
                            )}
                        </View>

                        {/* Book Button */}
                        <TouchableOpacity
                            style={[styles.bookButton, loading && styles.bookButtonDisabled]}
                            onPress={handleBookRide}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Text style={styles.bookButtonText}>Confirm Booking</Text>
                                    <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                                </>
                            )}
                        </TouchableOpacity>

                        <View style={{ height: 20 }} />
                    </ScrollView>
                </View>

                <LocationSearchModal
                    visible={showPickupSearch}
                    onClose={() => setShowPickupSearch(false)}
                    title="Choose Pickup"
                    placeholder="Search for pickup..."
                    locations={locations}
                    loading={loading}
                    onSearch={searchLocations}
                    onSelect={(loc) => {
                        setPickupLocation(loc);
                        setShowPickupSearch(false);
                    }}
                />

                <LocationSearchModal
                    visible={showDestinationSearch}
                    onClose={() => setShowDestinationSearch(false)}
                    title="Choose Destination"
                    placeholder="Search for destination..."
                    locations={locations}
                    loading={loading}
                    onSearch={searchLocations}
                    onSelect={(loc) => {
                        setDestinationLocation(loc);
                        setShowDestinationSearch(false);
                    }}
                />

                {/* End of innerContent wrapper */}
            </View>
            {/* End of desktop content wrapper */}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7f7f6",
    },
    content: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#666",
    },
    mapContainer: {
        height: height * 0.35,
        position: "relative",
    },
    map: {
        width: "100%",
        height: "100%",
    },
    mapPlaceholder: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f0f0",
    },
    mapPlaceholderText: {
        marginTop: 12,
        fontSize: 16,
        color: "#666",
        textAlign: "center",
    },
    floatingCard: {
        position: "absolute",
        bottom: 16,
        left: 16,
        right: 16,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        ...Platform.select({
            ios: {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
            web: {
                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
            },
        }),
    },
    locationInput: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
    },
    locationDot: {
        width: 32,
        height: 32,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    locationText: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 11,
        color: "#999",
        marginBottom: 2,
    },
    locationValue: {
        fontSize: 15,
        fontWeight: "600",
        color: "#333",
    },
    locationDivider: {
        height: 1,
        backgroundColor: "#eee",
        marginVertical: 8,
    },
    scrollContent: {
        flex: 1,
        backgroundColor: "#f7f7f6",
    },
    // Desktop responsive styles
    desktopContent: {
        alignItems: "center",
        backgroundColor: "#e8e8e8",
    },
    innerContent: {
        flex: 1,
        width: "100%",
    },
    desktopInnerContent: {
        maxWidth: 1200,
        width: "100%",
        backgroundColor: "#f7f7f6",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    section: {
        marginTop: 16,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
        marginBottom: 12,
    },
    rideTypesContainer: {
        paddingRight: 16,
    },
    rideTypeCard: {
        width: 120,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginRight: 12,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#eee",
    },
    rideTypeCardActive: {
        borderColor: "#D0BB95",
        backgroundColor: "#FFF9F0",
    },
    rideTypeName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#666",
        marginTop: 8,
    },
    rideTypeNameActive: {
        color: "#D0BB95",
    },
    rideTypePrice: {
        fontSize: 16,
        fontWeight: "700",
        color: "#333",
        marginTop: 4,
    },
    rideTypeTime: {
        fontSize: 11,
        color: "#999",
        marginTop: 2,
    },
    rideTypeSeats: {
        fontSize: 11,
        color: "#999",
    },
    fareCard: {
        margin: 16,
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#eee",
    },
    fareRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    fareLabel: {
        fontSize: 14,
        color: "#666",
    },
    fareValue: {
        fontSize: 24,
        fontWeight: "800",
        color: "#D0BB95",
    },
    fareNote: {
        fontSize: 11,
        color: "#999",
        marginTop: 8,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    driverCountBadge: {
        backgroundColor: "#4CAF50",
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    driverCountText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#fff",
    },
    selectDriverHint: {
        fontSize: 13,
        color: "#666",
        textAlign: "center",
        marginBottom: 12,
        fontStyle: "italic",
    },
    noDriversContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
    },
    noDriversText: {
        textAlign: "center",
        color: "#999",
        fontSize: 16,
        fontWeight: "600",
        marginTop: 12,
    },
    noDriversSubtext: {
        textAlign: "center",
        color: "#ccc",
        fontSize: 13,
        marginTop: 4,
    },
    driverSearchingIcon: {
        marginBottom: 16,
    },
    driverCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: "#eee",
        position: "relative",
    },
    driverCardActive: {
        borderColor: "#4CAF50",
        backgroundColor: "#F0FFF4",
    },
    driverAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#D0BB95",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    driverInfo: {
        flex: 1,
    },
    driverName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#333",
        marginBottom: 4,
    },
    driverRating: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    driverRatingText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#333",
        marginLeft: 4,
    },
    driverRidesText: {
        fontSize: 11,
        color: "#999",
        marginLeft: 4,
    },
    newDriverText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#4CAF50",
        fontStyle: "italic",
    },
    driverVehicle: {
        fontSize: 13,
        fontWeight: "600",
        color: "#666",
        marginBottom: 2,
    },
    driverPlate: {
        fontSize: 11,
        color: "#999",
    },
    driverMeta: {
        alignItems: "flex-end",
    },
    driverDistance: {
        fontSize: 13,
        fontWeight: "600",
        color: "#333",
    },
    driverEta: {
        fontSize: 11,
        color: "#999",
        marginTop: 2,
    },
    selectedBadge: {
        position: "absolute",
        top: 8,
        right: 8,
    },
    bookButton: {
        flexDirection: "row",
        backgroundColor: "#D0BB95",
        marginHorizontal: 16,
        marginTop: 8,
        padding: 18,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        ...Platform.select({
            ios: {
                shadowColor: "#D0BB95",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            },
            web: {
                boxShadow: "0px 4px 8px rgba(208, 187, 149, 0.3)",
            },
        }),
    },
    bookButtonDisabled: {
        opacity: 0.6,
    },
    bookButtonText: {
        fontSize: 18,
        fontWeight: "800",
        color: "#fff",
        marginRight: 8,
    },
});