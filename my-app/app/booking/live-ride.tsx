import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
    ActivityIndicator,
    Alert,
    Dimensions,
    Linking,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "@/components/map/MapComponents";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BookingHeader from "../../components/booking/BookingHeader";

import { bookingAPI } from "../../services/bookingAPI";
import { socketService } from "../../services/socketService";
import { useAuth } from "../../context/AuthContext";
import { routingService, RouteOption, RouteResponse } from "../../services/routing";
import RouteSelectionModal from "../../components/booking/RouteSelectionModal";
import RatingModal from "../../components/booking/RatingModal";
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

const { height } = Dimensions.get("window");

export default function LiveRide() {
    const [booking, setBooking] = useState<any>(null);
    const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
    const [driverLocation, setDriverLocation] = useState<any>(null);
    const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);

    // Route Selection State
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
    const [selectedRouteType, setSelectedRouteType] = useState<'fastest' | 'shortest' | 'balanced'>('fastest');
    const [recommendedRoute, setRecommendedRoute] = useState<'fastest' | 'shortest' | 'balanced'>('fastest');
    const [routeLoading, setRouteLoading] = useState(false);

    // Rating Modal State
    const [showRatingModal, setShowRatingModal] = useState(false);

    const { user } = useAuth();
    const { colors, darkMode } = useSettings();

    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        text: { color: colors.text },
        subText: { color: colors.subText },
        card: { backgroundColor: colors.card, borderColor: colors.border },
        bottomSheet: { backgroundColor: colors.card, shadowColor: darkMode ? "#000" : "#000" },
        border: { borderColor: colors.border },
    };

    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        loadBookingData();
        startLocationTracking();

        if (user?._id) {
            socketService.connect(user._id, 'user');

            socketService.onBookingAccepted((data) => {
                console.log("Ride accepted by driver:", data);
                loadBookingData();
                // Alert.alert("Ride Accepted", "A driver has accepted your request.");
            });

            socketService.onBookingRejected((data) => {
                // Alert.alert("Ride Declined", "The driver declined your request. Finding another driver...");
                router.replace('/home');
            });

            // Listen for driver location updates
            const socket = socketService.getSocket();

            socket?.on('driver:location:update', (data) => {
                if (data.bookingId === booking?._id || data.bookingId === booking?.id) {
                    setDriverLocation(data.location);
                }
            });

            // Driver Arrived
            socket?.on('driver:arrived', (data) => {
                console.log("Driver arrived:", data);
                // Alert.alert("Driver Arrived", "Your driver has arrived at the pickup location.");
                loadBookingData(); // Refresh status
            });

            // Ride Started
            socket?.on('ride:started', (data) => {
                console.log("Ride started:", data);
                // Alert.alert("Ride Started", "Your trip is now in progress.");
                loadBookingData(); // Refresh status
            });

            socketService.onBookingCompleted((data) => {
                console.log("Ride completed:", data);
                loadBookingData(); // Refresh to get final booking data
                // Skip payment modal, go directly to rating
                setTimeout(() => setShowRatingModal(true), 500);
            });
        }

        return () => {
            if (locationSubscription) locationSubscription.remove();
            socketService.off('booking:accepted');
            socketService.off('booking:rejected');
            socketService.off('booking:completed');
            socketService.off('driver:location:update');
            socketService.off('driver:arrived');
            socketService.off('ride:started');
        };
    }, [user?._id, booking?._id]);

    const handleCallDriver = () => {
        if (booking?.driver?.phone) {
            Linking.openURL(`tel:${booking.driver.phone}`);
        } else {
            Alert.alert("Info", "Driver phone number not available");
        }
    };

    useEffect(() => {
        if (!mapRef.current || !driverLocation || !currentLocation) return;

        mapRef.current.fitToCoordinates([
            { latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude },
            { latitude: driverLocation.latitude, longitude: driverLocation.longitude }
        ], {
            edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
            animated: true
        });

    }, [driverLocation]); // Only re-fit when driver moves significantly to avoid jitter, or just driverLocation

    useEffect(() => {
        let isMounted = true;
        const updateRoute = async () => {
            if (!booking) return;

            const startNode = driverLocation || currentLocation?.coords;
            if (!startNode) return;

            const start = {
                latitude: startNode.latitude,
                longitude: startNode.longitude
            };

            let end;
            if (booking.status === 'in_progress' || booking.status === 'started') {
                end = {
                    latitude: booking.destination?.coordinates?.latitude,
                    longitude: booking.destination?.coordinates?.longitude
                };
            } else {
                end = {
                    latitude: booking.pickup?.coordinates?.latitude,
                    longitude: booking.pickup?.coordinates?.longitude
                };
            }

            if (start.latitude && end?.latitude) {
                // Use selected route if available
                const selectedRoute = routeOptions.find(r => r.type === selectedRouteType);
                if (selectedRoute && selectedRoute.coordinates.length > 0) {
                    if (isMounted) setRouteCoordinates(selectedRoute.coordinates);
                } else {
                    // Fallback to basic route
                    const route = await routingService.getRoute(start, end);
                    if (isMounted) setRouteCoordinates(route);
                }
            }
        };

        const timeout = setTimeout(updateRoute, 1000);
        return () => { isMounted = false; clearTimeout(timeout); };
    }, [driverLocation, currentLocation, booking?.status, selectedRouteType, routeOptions]);

    // Fetch route options when modal is opened
    useEffect(() => {
        if (!showRouteModal || routeOptions.length > 0) return;

        const fetchRouteOptions = async () => {
            if (!booking) return;

            const startNode = driverLocation || currentLocation?.coords;
            if (!startNode) return;

            try {
                setRouteLoading(true);
                const start = {
                    latitude: startNode.latitude,
                    longitude: startNode.longitude
                };

                let end;
                if (booking.status === 'in_progress' || booking.status === 'started') {
                    end = {
                        latitude: booking.destination?.coordinates?.latitude,
                        longitude: booking.destination?.coordinates?.longitude
                    };
                } else {
                    end = {
                        latitude: booking.pickup?.coordinates?.latitude,
                        longitude: booking.pickup?.coordinates?.longitude
                    };
                }

                if (start.latitude && end?.latitude) {
                    const vehicleType = (booking.rideType?.id || 'bike') as 'bike' | 'auto' | 'car' | 'suv';
                    const routeResponse: RouteResponse = await routingService.getRouteOptions(
                        start,
                        end,
                        vehicleType
                    );

                    setRouteOptions(routeResponse.routes);
                    setRecommendedRoute(routeResponse.recommended);
                }
            } catch (error) {
                console.error('Error fetching route options:', error);
            } finally {
                setRouteLoading(false);
            }
        };

        fetchRouteOptions();
    }, [showRouteModal, booking, driverLocation, currentLocation]);

    const loadBookingData = async () => {
        try {
            setLoading(true);
            setError(null);
            const bookingId = await AsyncStorage.getItem('currentBookingId');

            if (!bookingId) {
                setError('No active booking ID found. Please go back to home.');
                return;
            }

            console.log("Loading booking data for ID:", bookingId);
            const bookingData = await bookingAPI.getBooking(bookingId);

            if (bookingData.success) {
                setBooking(bookingData.booking);
            } else {
                setError(bookingData.message || `Failed to load details for ID: ${bookingId}`);
            }
        } catch (error: any) {
            console.error('Error loading booking:', error);
            setError(error.message || 'Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    const startLocationTracking = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Location permission denied');
                Alert.alert('Permission Denied', 'Location access is required to track your ride.');
                return;
            }

            const subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    timeInterval: 5000,
                    distanceInterval: 10,
                },
                (newLocation) => {
                    setCurrentLocation(newLocation);
                    // Only animate if tracking mode enabled (can be added later)
                }
            );

            setLocationSubscription(subscription);
        } catch (error) {
            console.error('Error starting location tracking:', error);
        }
    };

    const handleCancelRide = async () => {
        Alert.alert(
            'Cancel Ride',
            'Are you sure you want to cancel this ride?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (booking?._id || booking?.id) {
                                await bookingAPI.cancelBooking(
                                    booking._id || booking.id,
                                    'User cancelled'
                                );
                            }
                            await AsyncStorage.removeItem('currentBookingId');
                            router.replace('/home');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to cancel ride');
                        }
                    },
                },
            ]
        );
    };

    const handleSubmitRating = async (rating: number, feedback: string) => {
        try {
            const bookingId = booking?._id || booking?.id;
            if (!bookingId) {
                throw new Error('No booking ID found');
            }

            await bookingAPI.rateDriver(bookingId, rating, feedback);
            setShowRatingModal(false);

            // Alert.alert(
            //     'Thank You!',
            //     'Your rating has been submitted successfully.',
            //     [
            //         {
            //             text: 'OK',
            //             onPress: async () => {
            //                 await AsyncStorage.removeItem('currentBookingId');
            //                 router.replace('/home');
            //             }
            //         }
            //     ]
            // );
            // Auto redirect instead
            await AsyncStorage.removeItem('currentBookingId');
            router.replace('/home');
        } catch (error) {
            console.error('Error submitting rating:', error);
            Alert.alert('Error', 'Failed to submit rating. Please try again.');
        }
    };

    const handleSkipRating = async () => {
        setShowRatingModal(false);
        await AsyncStorage.removeItem('currentBookingId');
        router.replace('/home');
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, dynamicStyles.container]}>
                <BookingHeader title="Your Ride" />
                <View style={[styles.loadingContainer, dynamicStyles.container]}>
                    <ActivityIndicator size="large" color="#D0BB95" />
                    <Text style={[styles.loadingText, dynamicStyles.subText]}>Loading ride details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!booking || error) {
        return (
            <SafeAreaView style={[styles.container, dynamicStyles.container]}>
                <BookingHeader title="Your Ride" />
                <View style={[styles.loadingContainer, dynamicStyles.container]}>
                    <Text style={[styles.errorText, dynamicStyles.text]}>
                        {error || 'No active ride found'}
                        {/* Debug info - remove for production */}
                        {`\n(ID: ${booking?._id || 'none'})`}
                    </Text>
                    <TouchableOpacity
                        style={[styles.backButton, { marginBottom: 12, backgroundColor: '#4FD1C5' }]}
                        onPress={loadBookingData}
                    >
                        <Text style={[styles.backButtonText, { color: '#fff' }]}>Retry</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.replace('/home')}
                    >
                        <Text style={styles.backButtonText}>Go Home</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const pickupCoords = {
        latitude: booking.pickup?.coordinates?.latitude || 0,
        longitude: booking.pickup?.coordinates?.longitude || 0,
    };

    const destinationCoords = {
        latitude: booking.destination?.coordinates?.latitude || 0,
        longitude: booking.destination?.coordinates?.longitude || 0,
    };

    // Show PIN only when accepted or arrived
    const showPin = (booking.status === 'accepted' || booking.status === 'driver_arrived') && booking.verificationPin;

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]}>
            {/* Map Area - Full Screen */}
            <MapView
                ref={mapRef}
                style={styles.map}
                customMapStyle={darkMode ? darkMapStyle : []}
                provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
                initialRegion={{
                    latitude: currentLocation?.coords.latitude || pickupCoords.latitude,
                    longitude: currentLocation?.coords.longitude || pickupCoords.longitude,
                    latitudeDelta: 0.02,
                    longitudeDelta: 0.02,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
                followsUserLocation={true}
            >
                <Marker coordinate={pickupCoords} title="Pickup" pinColor="#4CAF50" />
                <Marker coordinate={destinationCoords} title="Destination" pinColor="#D0BB95" />

                {driverLocation && (
                    <Marker
                        coordinate={{
                            latitude: driverLocation.latitude,
                            longitude: driverLocation.longitude,
                        }}
                        title="Driver"
                    >
                        <View style={styles.driverMarker}>
                            <MaterialIcons name="directions-car" size={24} color="#fff" />
                        </View>
                    </Marker>
                )}

                {routeCoordinates.length > 0 && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeColor="#4FD1C5"
                        strokeWidth={5}
                    />
                )}
            </MapView>

            {/* Status Banner */}
            <View style={styles.statusBanner}>
                <LinearGradient
                    colors={booking.status === 'in_progress' ? ['#4CAF50', '#388E3C'] : ['#4FD1C5', '#38B2AC']}
                    style={styles.statusGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <View style={styles.statusContent}>
                        <View style={styles.statusIconContainer}>
                            <MaterialIcons
                                name={booking.status === 'in_progress' ? "navigation" : "directions-car"}
                                size={24}
                                color="#fff"
                            />
                        </View>
                        <View style={styles.statusTextContainer}>
                            <Text style={styles.statusTitle}>
                                {booking.status === 'in_progress' ? 'On Trip' : 'Driver Arriving'}
                            </Text>
                            <Text style={styles.statusSubtitle}>
                                {booking.status === 'accepted' ? 'Driver is on the way' :
                                    booking.status === 'driver_arrived' ? 'Driver has arrived' :
                                        'Heading to destination'}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            {/* Floating Action Buttons */}
            <View style={styles.floatingActions}>
                {booking.status === 'in_progress' && (
                    <TouchableOpacity
                        style={styles.floatingBtn}
                        onPress={() => setShowRouteModal(true)}
                    >
                        <MaterialIcons name="alt-route" size={24} color="#333" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Bottom Info Card */}
            <View style={[styles.bottomSheet, dynamicStyles.bottomSheet]}>
                <ScrollView
                    style={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    {/* Driver Header Row: Avatar - Name/Details - Call */}
                    <View style={styles.driverHeaderRow}>
                        <View style={styles.driverAvatar}>
                            <MaterialIcons name="person" size={32} color="#fff" />
                        </View>

                        <View style={styles.driverCenterInfo}>
                            <Text style={[styles.driverName, dynamicStyles.text]}>
                                {booking.driver?.name || 'Driver'}
                            </Text>
                            <Text style={[styles.vehicle, dynamicStyles.subText]}>
                                {booking.rideType?.name || 'Vehicle'} • {
                                    typeof booking.driver?.vehicle === 'object'
                                        ? `${booking.driver.vehicle.model || ''} (${booking.driver.vehicle.plateNumber || 'N/A'})`
                                        : (booking.driver?.vehicle || 'N/A')
                                }
                            </Text>
                            <View style={styles.statusBadge}>
                                <View style={[styles.statusDot, {
                                    backgroundColor: booking.status === 'in_progress' ? '#4CAF50' : '#FFA726'
                                }]} />
                                <Text style={styles.statusText}>
                                    {booking.status === 'accepted' ? 'En Route' :
                                        booking.status === 'driver_arrived' ? 'Arrived' :
                                            'In Progress'}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.callBtn} onPress={handleCallDriver}>
                            <MaterialIcons name="call" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* PIN Display - Full Width Below Driver Info */}
                    {showPin && (
                        <View style={[styles.pinSection, dynamicStyles.border]}>
                            <Text style={[styles.pinSectionLabel, dynamicStyles.subText]}>START PIN</Text>
                            <View style={styles.pinBoxLarge}>
                                <Text style={styles.pinValueLarge}>{booking.verificationPin}</Text>
                            </View>
                        </View>
                    )}

                    {/* Trip Details */}
                    <View style={styles.tripDetails}>
                        <View style={styles.locationItem}>
                            <View style={styles.locationIconContainer}>
                                <View style={[styles.locationDot, { backgroundColor: '#4CAF50' }]} />
                            </View>
                            <View style={styles.locationInfo}>
                                <Text style={[styles.locationLabel, dynamicStyles.subText]}>PICKUP LOCATION</Text>
                                <Text style={[styles.locationValue, dynamicStyles.text]} numberOfLines={1}>{booking.pickup?.name}</Text>
                            </View>
                        </View>

                        <View style={styles.locationConnector} />

                        <View style={styles.locationItem}>
                            <View style={styles.locationIconContainer}>
                                <View style={[styles.locationDot, { backgroundColor: '#D0BB95' }]} />
                            </View>
                            <View style={styles.locationInfo}>
                                <Text style={[styles.locationLabel, dynamicStyles.subText]}>DROP-OFF LOCATION</Text>
                                <Text style={[styles.locationValue, dynamicStyles.text]} numberOfLines={1}>{booking.destination?.name}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Cancel Button */}
                    <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelRide}>
                        <MaterialIcons name="close" size={20} color="#d32f2f" />
                        <Text style={styles.cancelText}>Cancel Ride</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* Route Selection Modal */}
            <RouteSelectionModal
                visible={showRouteModal}
                onClose={() => setShowRouteModal(false)}
                onSelectRoute={(route) => {
                    setSelectedRouteType(route.type);
                    setRouteCoordinates(route.coordinates);
                }}
                routes={routeOptions}
                recommended={recommendedRoute}
                loading={routeLoading}
            />



            {/* Rating Modal */}
            <RatingModal
                visible={showRatingModal}
                driverName={booking?.driver?.name || 'Your Driver'}
                onSubmit={handleSubmitRating}
                onSkip={handleSkipRating}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    map: {
        flex: 1,
        width: "100%",
        height: "100%",
    },

    // Status Banner
    statusBanner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    statusGradient: {
        paddingTop: 50,
        paddingBottom: 16,
        paddingHorizontal: 20,
    },
    statusContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    statusTextContainer: {
        flex: 1,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 4,
    },
    statusSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
    },

    // Floating Actions
    floatingActions: {
        position: 'absolute',
        top: 120,
        right: 20,
        zIndex: 10,
        gap: 12,
    },
    floatingBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },

    // Bottom Sheet
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
        maxHeight: '55%',
    },
    scrollContent: {
        flex: 1,
    },

    // Driver Header Row
    driverHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    driverAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#4FD1C5",
        marginRight: 14,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: '#4FD1C5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    driverCenterInfo: {
        flex: 1,
        marginLeft: 12,
    },
    driverName: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1a1a1a",
        marginBottom: 6,
    },
    vehicle: {
        color: "#666",
        marginTop: 4,
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 6,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#666',
    },
    callBtn: {
        backgroundColor: "#4CAF50",
        padding: 12,
        borderRadius: 24,
        marginLeft: 10,
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },

    // PIN Display
    pinDisplay: {
        alignItems: 'center',
        paddingHorizontal: 12,
        marginLeft: 'auto',
        marginRight: 10,
    },
    pinBox: {
        backgroundColor: '#4FD1C510',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#4FD1C5',
        marginTop: 4,
    },
    pinLabel: {
        fontSize: 10,
        color: '#666',
        fontWeight: '800',
        letterSpacing: 1,
    },
    pinValue: {
        fontSize: 24,
        fontWeight: '900',
        color: '#4FD1C5',
        letterSpacing: 4,
    },

    // PIN Display - Full Width Section
    pinSection: {
        alignItems: 'center',
        paddingVertical: 16,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    pinSectionLabel: {
        fontSize: 11,
        color: '#999',
        fontWeight: '800',
        letterSpacing: 1.5,
        marginBottom: 10,
    },
    pinBoxLarge: {
        backgroundColor: '#4FD1C515',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#4FD1C5',
    },
    pinValueLarge: {
        fontSize: 36,
        fontWeight: '900',
        color: '#4FD1C5',
        letterSpacing: 8,
    },

    // Trip Details
    tripDetails: {
        marginBottom: 16,
    },
    locationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    locationIconContainer: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    locationDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    locationInfo: {
        flex: 1,
        paddingVertical: 4,
    },
    locationLabel: {
        fontSize: 11,
        color: '#999',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    locationValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1a1a1a',
    },
    locationConnector: {
        width: 2,
        height: 20,
        backgroundColor: '#e0e0e0',
        marginLeft: 15,
        marginVertical: 4,
    },

    // Cancel Button
    cancelBtn: {
        backgroundColor: "#fff",
        padding: 14,
        borderRadius: 14,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#d32f2f",
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    cancelText: {
        color: "#d32f2f",
        fontWeight: "800",
        fontSize: 16,
    },

    // Driver Marker
    driverMarker: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#4FD1C5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
    },

    // Loading States
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: "#666",
        fontWeight: '600',
    },
    errorText: {
        fontSize: 16,
        color: "#666",
        marginBottom: 20,
        fontWeight: '600',
    },
    backButton: {
        backgroundColor: "#4FD1C5",
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 14,
    },
    backButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "800",
    },
});