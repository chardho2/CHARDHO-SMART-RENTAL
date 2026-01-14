import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, Dimensions, Alert, Platform, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from '../../../components/map/MapComponents';
import * as Location from 'expo-location';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSettings } from '../../../context/SettingsContext';
import { socketService } from '../../../services/socketService';
import { storageService } from '../../../services/storage';
import driverAPI from '../../../services/driverAPI';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';

const { width, height } = Dimensions.get('window');

export default function DriverDashboard() {
    const { colors, darkMode } = useSettings();
    const [isOnline, setIsOnline] = useState(false);
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        todayEarnings: 0,
        todayRides: 0,
        rating: 4.8
    });
    const mapRef = useRef<MapView>(null);

    // Refresh stats when screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchStats();
        }, [])
    );

    useEffect(() => {
        loadInitialState();
        setupSocket();
    }, []);

    useEffect(() => {
        if (location && isOnline) {
            updateDriverLocation(location);
        }
    }, [location, isOnline]);

    const fetchStats = async () => {
        try {
            const user = await storageService.getUser();
            if (user) {
                // Use new wallet API for consistent stats
                const { walletAPI } = await import('../../../services/walletAPI');
                const statsRes = await walletAPI.getStats('today');

                if (statsRes.success) {
                    // Also get rating from profile separately if needed, or assume it's passed or stored
                    // For now, let's keep rating static or fetch from profile if available
                    // The wallet stats gives us financial data

                    setStats({
                        // Actually wallet stats 'today' returns credits/debits matching today
                        // Let's use credits.total for today's earnings
                        todayEarnings: statsRes.stats.credits.total || 0,
                        todayRides: statsRes.stats.credits.count || 0,
                        rating: 4.8 // TODO: Fetch from profile API
                    });
                }
            }
        } catch (error) {
            console.log('Failed to fetch stats', error);
        }
    };

    const loadInitialState = async () => {
        try {
            setLoading(true);
            // 1. Get Location Permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Allow location access to go online.');
                return;
            }

            // Try to get current position
            let currentLocation: Location.LocationObject | null = null;
            try {
                currentLocation = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced
                });
            } catch (locError) {
                console.log('Using last known location fallback...');
                currentLocation = await Location.getLastKnownPositionAsync();
            }

            // Final fallback if both fail
            if (!currentLocation) {
                // Mock location (Bangalore) to prevent crash
                currentLocation = {
                    coords: {
                        latitude: 12.9716,
                        longitude: 77.5946,
                        altitude: 0,
                        accuracy: 0,
                        altitudeAccuracy: 0,
                        heading: 0,
                        speed: 0
                    },
                    timestamp: Date.now()
                };
            }

            setLocation(currentLocation);

            // Center map
            if (mapRef.current && currentLocation) {
                mapRef.current.animateToRegion({
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                });
            }

            // 2. Fetch Stats
            await fetchStats();

        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const setupSocket = async () => {
        const user = await storageService.getUser();
        if (user) {
            // Connect socket
            socketService.connect(user._id, 'driver');

            // Listen for new bookings
            socketService.onNewBooking((data) => {
                console.log('🔔 New booking received:', data);

                // Extract booking ID
                const bookingId = data._id || data.bookingId;

                if (bookingId) {
                    // Navigate directly to trip request screen without popup
                    router.push(`/driver/trip-request?bookingId=${bookingId}` as any);
                } else {
                    console.error('❌ Invalid booking data - no ID found');
                    Alert.alert('Error', 'Invalid booking data received');
                }
            });
        }
    };

    const toggleOnlineStatus = async (value: boolean) => {
        try {
            console.log(`🔄 Toggling status to: ${value ? 'online' : 'offline'}`);

            // Verify user is logged in
            const user = await storageService.getUser();
            const token = await storageService.getToken();

            if (!user || !token) {
                Alert.alert('Error', 'Please login again to continue');
                router.replace('/login');
                return;
            }

            // Optimistic update
            setIsOnline(value);

            // Make API call
            const response = await driverAPI.updateStatus(value ? 'online' : 'offline');

            if (response.success) {
                console.log('✅ Status updated successfully');

                if (value && location) {
                    updateDriverLocation(location);
                    startLocationTracking();
                } else {
                    stopLocationTracking();
                }
            } else {
                throw new Error(response.message || 'Failed to update status');
            }
        } catch (error: any) {
            console.error('❌ Toggle status error:', error);

            // Revert optimistic update
            setIsOnline(!value);

            // Show user-friendly error message
            const errorMessage = error.response?.data?.message ||
                error.message ||
                'Failed to update status. Please check your connection.';

            Alert.alert('Error', errorMessage);
        }
    };

    // Location Tracking Interval
    const locationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    const startLocationTracking = () => {
        if (locationInterval.current) clearInterval(locationInterval.current);
        locationInterval.current = setInterval(async () => {
            try {
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                setLocation(loc);
                updateDriverLocation(loc);
            } catch (e) {
                // Silently fail or use last known if critical
                // console.log('Location interval update failed', e);
            }
        }, 10000); // Every 10s
    };

    const stopLocationTracking = () => {
        if (locationInterval.current) {
            clearInterval(locationInterval.current);
            locationInterval.current = null;
        }
    };

    const updateDriverLocation = (loc: Location.LocationObject) => {
        // Send to server via socket
        const user = storageService.getUser(); // Sync call if cached, or use effect dep
        // For now assuming we have ID
        // socketService.updateLocation(...)
    };

    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        card: { backgroundColor: colors.card },
        text: { color: colors.text },
        subText: { color: colors.subText },
    };

    return (
        <View style={styles.container}>
            {/* Map Background */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                showsUserLocation={true}
                showsCompass={false}
                showsMyLocationButton={false}
                initialRegion={{
                    latitude: 12.9716, // Default fallback (Bangalore)
                    longitude: 77.5946,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                customMapStyle={darkMode ? mapDarkStyle : []}
            />

            {/* Top Header / Stats */}
            <View style={styles.headerOverlay}>
                <LinearGradient
                    colors={darkMode ? ['rgba(0,0,0,0.9)', 'transparent'] : ['rgba(255,255,255,0.9)', 'transparent']}
                    style={styles.headerGradient}
                >
                    <View style={styles.statsContainer}>
                        <View style={[styles.statBox, dynamicStyles.card]}>
                            <Text style={[styles.statLabel, dynamicStyles.subText]}>Earned</Text>
                            <Text style={[styles.statValue, { color: '#4FD1C5' }]}>₹{stats.todayEarnings}</Text>
                        </View>
                        <View style={[styles.statBox, dynamicStyles.card]}>
                            <Text style={[styles.statLabel, dynamicStyles.subText]}>Rides</Text>
                            <Text style={[styles.statValue, dynamicStyles.text]}>{stats.todayRides}</Text>
                        </View>
                        <View style={[styles.statBox, dynamicStyles.card]}>
                            <Text style={[styles.statLabel, dynamicStyles.subText]}>Rating</Text>
                            <View style={styles.ratingRow}>
                                <Text style={[styles.statValue, dynamicStyles.text]}>{stats.rating}</Text>
                                <MaterialIcons name="star" size={14} color="#FFD700" />
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            {/* Bottom Panel */}
            <View style={[styles.bottomPanel, dynamicStyles.card]}>
                <View style={styles.statusRow}>
                    <View>
                        <Text style={[styles.statusTitle, dynamicStyles.text]}>
                            {isOnline ? 'You are Online' : 'You are Offline'}
                        </Text>
                        <Text style={[styles.statusSubtitle, dynamicStyles.subText]}>
                            {isOnline ? 'Waiting for requests...' : 'Go online to receive rides'}
                        </Text>
                    </View>
                    <Switch
                        value={isOnline}
                        onValueChange={toggleOnlineStatus}
                        trackColor={{ false: "#767577", true: "#4FD1C5" }}
                        thumbColor={"#f4f3f4"}
                        ios_backgroundColor="#3e3e3e"
                    />
                </View>

                {isOnline && (
                    <View style={styles.radarContainer}>
                        <ActivityIndicator size="small" color="#4FD1C5" />
                        <Text style={{ color: colors.subText, marginLeft: 8 }}>Searching for riders...</Text>
                    </View>
                )}

                {/* Quick Actions */}
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                        if (mapRef.current && location) {
                            mapRef.current.animateToRegion({
                                latitude: location.coords.latitude,
                                longitude: location.coords.longitude,
                                latitudeDelta: 0.005,
                                longitudeDelta: 0.005,
                            });
                        }
                    }}
                >
                    <MaterialIcons name="my-location" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const mapDarkStyle = [
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
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#6b9a76" }]
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
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#1f2835" }]
    },
    {
        "featureType": "road.highway",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#f3d19c" }]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#17263c" }]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#515c6d" }]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#17263c" }]
    }
];

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        width: width,
        height: height,
        ...StyleSheet.absoluteFillObject,
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        width: '100%',
        zIndex: 10,
    },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    statBox: {
        flex: 1,
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 4,
        fontWeight: '600',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    bottomPanel: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        padding: 20,
        borderRadius: 24,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    statusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    statusSubtitle: {
        fontSize: 13,
    },
    radarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        backgroundColor: 'rgba(79, 209, 197, 0.1)',
        padding: 10,
        borderRadius: 12,
    },
    actionButton: {
        position: 'absolute',
        top: -60,
        right: 0,
        backgroundColor: '#fff',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    }
});
