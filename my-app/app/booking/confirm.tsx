import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
    ActivityIndicator,
    Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "../../components/map/MapComponents";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BookingHeader from "../../components/booking/BookingHeader";
import { bookingAPI } from "../../services/bookingAPI";
import { routingService } from "../../services/routing";
import { useSettings } from "../../context/SettingsContext"; // Added

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

const { width } = Dimensions.get("window");

export default function ConfirmBooking() {
    const [bookingData, setBookingData] = useState<any>(null);
    const [driverData, setDriverData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
    const { colors, darkMode } = useSettings();

    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        text: { color: colors.text },
        subText: { color: colors.subText },
        card: { backgroundColor: colors.card, borderColor: colors.border },
        border: { borderColor: colors.border },
    };

    useEffect(() => {
        loadBookingData();
    }, []);

    useEffect(() => {
        if (bookingData) {
            const fetchRoute = async () => {
                const route = await routingService.getRoute(
                    bookingData.pickup.coordinates,
                    bookingData.destination.coordinates
                );
                setRouteCoordinates(route);
            };
            fetchRoute();
        }
    }, [bookingData]);

    const loadBookingData = async () => {
        try {
            const booking = await AsyncStorage.getItem('pendingBooking');
            const driver = await AsyncStorage.getItem('selectedDriver');

            if (!booking) {
                Alert.alert('Error', 'No booking data found');
                router.back();
                return;
            }

            setBookingData(JSON.parse(booking));
            if (driver) {
                setDriverData(JSON.parse(driver));
            }
        } catch (error) {
            console.error('Error loading booking data:', error);
            Alert.alert('Error', 'Failed to load booking data');
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmBooking = async () => {
        if (!bookingData) return;

        try {
            setConfirming(true);

            // Create booking via API
            const result = await bookingAPI.createBooking(bookingData);
            console.log('Create booking response:', JSON.stringify(result, null, 2));

            // Extract booking ID from response
            const bookingId = result.booking?._id || result.booking?.id || (result as any)._id || (result as any).id;

            if (!bookingId) {
                console.error('Missing booking ID in response:', result);
                throw new Error('No booking ID received from server');
            }

            // Store the booking ID
            await AsyncStorage.setItem('currentBookingId', String(bookingId));

            // Do not remove pendingBooking here, as Searching screen needs it
            // await AsyncStorage.removeItem('pendingBooking');
            await AsyncStorage.removeItem('selectedDriver');

            // Navigate to searching/waiting screen
            router.replace("/booking/searching");
        } catch (error: any) {
            console.error('Error confirming booking:', error);
            Alert.alert(
                'Booking Failed',
                error.response?.data?.message || error.message || 'Failed to confirm booking. Please try again.'
            );
        } finally {
            setConfirming(false);
        }
    };

    const handleCancel = () => {
        router.back();
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, dynamicStyles.container]}>
                <BookingHeader title="Confirm Your Booking" />
                <View style={[styles.loadingContainer, dynamicStyles.container]}>
                    <ActivityIndicator size="large" color="#D0BB95" />
                    <Text style={[styles.loadingText, dynamicStyles.subText]}>Loading booking details...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!bookingData) {
        return null;
    }

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]}>
            <BookingHeader title="Confirm Your Booking" />

            <ScrollView style={[styles.content, dynamicStyles.container]} showsVerticalScrollIndicator={false}>
                {/* Map Preview */}
                <View style={[styles.mapContainer, dynamicStyles.border]}>
                    <MapView
                        style={styles.map}
                        customMapStyle={darkMode ? darkMapStyle : []}
                        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
                        initialRegion={{
                            latitude: (bookingData.pickup.coordinates.latitude + bookingData.destination.coordinates.latitude) / 2,
                            longitude: (bookingData.pickup.coordinates.longitude + bookingData.destination.coordinates.longitude) / 2,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        }}
                        scrollEnabled={false}
                        zoomEnabled={false}
                    >
                        <Marker
                            coordinate={{
                                latitude: bookingData.pickup.coordinates.latitude,
                                longitude: bookingData.pickup.coordinates.longitude
                            }}
                            pinColor="#4CAF50"
                        />
                        <Marker
                            coordinate={{
                                latitude: bookingData.destination.coordinates.latitude,
                                longitude: bookingData.destination.coordinates.longitude
                            }}
                            pinColor="#D0BB95"
                        />
                        <Polyline
                            coordinates={routeCoordinates.length > 0 ? routeCoordinates : [
                                {
                                    latitude: bookingData.pickup.coordinates.latitude,
                                    longitude: bookingData.pickup.coordinates.longitude
                                },
                                {
                                    latitude: bookingData.destination.coordinates.latitude,
                                    longitude: bookingData.destination.coordinates.longitude
                                },
                            ]}
                            strokeColor="#D0BB95"
                            strokeWidth={3}
                        />
                    </MapView>
                </View>

                {/* Trip Details */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.text]}>Trip Details</Text>

                    <View style={[styles.card, dynamicStyles.card]}>
                        {/* Pickup */}
                        <View style={styles.locationRow}>
                            <View style={styles.iconContainer}>
                                <View style={[styles.locationDot, { backgroundColor: "#4CAF50" }]} />
                            </View>
                            <View style={styles.locationInfo}>
                                <Text style={[styles.locationLabel, dynamicStyles.subText]}>Pickup</Text>
                                <Text style={[styles.locationName, dynamicStyles.text]}>{bookingData.pickup.name}</Text>
                                <Text style={[styles.locationAddress, dynamicStyles.subText]}>{bookingData.pickup.address}</Text>
                            </View>
                        </View>

                        <View style={styles.routeLine} />

                        {/* Destination */}
                        <View style={styles.locationRow}>
                            <View style={styles.iconContainer}>
                                <View style={[styles.locationDot, { backgroundColor: "#D0BB95" }]} />
                            </View>
                            <View style={styles.locationInfo}>
                                <Text style={[styles.locationLabel, dynamicStyles.subText]}>Destination</Text>
                                <Text style={[styles.locationName, dynamicStyles.text]}>{bookingData.destination.name}</Text>
                                <Text style={[styles.locationAddress, dynamicStyles.subText]}>{bookingData.destination.address}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Ride Type */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.text]}>Ride Type</Text>
                    <View style={[styles.card, dynamicStyles.card]}>
                        <View style={styles.rideTypeRow}>
                            <View style={[styles.rideTypeIcon, dynamicStyles.border, { backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : '#FFF9F0' }]}>
                                <MaterialIcons name={bookingData.rideType.icon as any} size={32} color="#D0BB95" />
                            </View>
                            <View style={styles.rideTypeInfo}>
                                <Text style={[styles.rideTypeName, dynamicStyles.text]}>{bookingData.rideType.name}</Text>
                                <Text style={[styles.rideTypeMeta, dynamicStyles.subText]}>
                                    {bookingData.fare.distance} km • {bookingData.estimatedTime} min
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Driver Details - only show if driver is selected */}
                {driverData && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, dynamicStyles.text]}>Your Driver</Text>
                        <View style={[styles.card, dynamicStyles.card]}>
                            <View style={styles.driverRow}>
                                <View style={styles.driverAvatar}>
                                    <MaterialIcons name="person" size={32} color="#fff" />
                                </View>
                                <View style={styles.driverInfo}>
                                    <Text style={[styles.driverName, dynamicStyles.text]}>{driverData.name}</Text>
                                    <View style={styles.driverRating}>
                                        <MaterialIcons name="star" size={16} color="#FFB800" />
                                        <Text style={[styles.driverRatingText, dynamicStyles.text]}>{driverData.rating}</Text>
                                    </View>
                                    <Text style={[styles.driverVehicle, dynamicStyles.subText]}>
                                        {driverData.vehicle} • {driverData.plate}
                                    </Text>
                                </View>

                            </View>
                        </View>
                    </View>
                )}

                {/* Fare Breakdown */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.text]}>Fare Estimate</Text>
                    <View style={[styles.card, dynamicStyles.card]}>
                        <View style={styles.fareRow}>
                            <Text style={[styles.fareLabel, dynamicStyles.subText]}>Base Fare</Text>
                            <Text style={[styles.fareValue, dynamicStyles.text]}>₹{bookingData.fare.baseFare}</Text>
                        </View>
                        <View style={styles.fareRow}>
                            <Text style={[styles.fareLabel, dynamicStyles.subText]}>
                                Distance Charge ({bookingData.fare.distance} km)
                            </Text>
                            <Text style={[styles.fareValue, dynamicStyles.text]}>₹{bookingData.fare.distanceCharge}</Text>
                        </View>
                        {bookingData.fare.minFareAdjustment > 0 && (
                            <View style={styles.fareRow}>
                                <Text style={[styles.fareLabel, dynamicStyles.subText]}>Minimum Fare Adjustment</Text>
                                <Text style={[styles.fareValue, dynamicStyles.text]}>₹{bookingData.fare.minFareAdjustment}</Text>
                            </View>
                        )}
                        <View style={styles.fareDivider} />
                        <View style={styles.fareRow}>
                            <Text style={[styles.fareTotalLabel, dynamicStyles.text]}>Estimated Total</Text>
                            <Text style={styles.fareTotalValue}>₹{bookingData.fare.total}</Text>
                        </View>
                        <View style={[styles.paymentNote, { backgroundColor: darkMode ? 'rgba(255, 249, 240, 0.1)' : '#FFF9F0' }]}>
                            <MaterialIcons name="info-outline" size={16} color={colors.subText} />
                            <Text style={[styles.paymentNoteText, dynamicStyles.subText]}>
                                Payment will be collected after the ride is completed
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Important Notes */}
                <View style={styles.section}>
                    <View style={[styles.noteCard, dynamicStyles.card]}>
                        <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                        <Text style={[styles.noteText, dynamicStyles.subText]}>
                            Your ride will be confirmed once the driver accepts
                        </Text>
                    </View>
                    <View style={[styles.noteCard, dynamicStyles.card]}>
                        <MaterialIcons name="schedule" size={20} color="#FF9800" />
                        <Text style={[styles.noteText, dynamicStyles.subText]}>
                            Driver will arrive in approximately 2-3 minutes
                        </Text>
                    </View>
                    <View style={[styles.noteCard, dynamicStyles.card]}>
                        <MaterialIcons name="payment" size={20} color="#2196F3" />
                        <Text style={[styles.noteText, dynamicStyles.subText]}>
                            Pay after your ride via Cash, UPI, or Card
                        </Text>
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.confirmButton, confirming && { opacity: 0.6 }]}
                        onPress={handleConfirmBooking}
                        disabled={confirming}
                    >
                        {confirming ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                                <MaterialIcons name="check" size={24} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.cancelButton, dynamicStyles.card]}
                        onPress={handleCancel}
                        disabled={confirming}
                    >
                        <Text style={[styles.cancelButtonText, dynamicStyles.subText]}>Cancel</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 20 }} />
            </ScrollView>
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
        height: 200,
        margin: 16,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#eee",
    },
    map: {
        width: "100%",
        height: "100%",
    },
    section: {
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
        marginBottom: 12,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#eee",
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    iconContainer: {
        width: 32,
        height: 32,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    locationDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    locationInfo: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 12,
        color: "#999",
        marginBottom: 4,
    },
    locationName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#333",
        marginBottom: 2,
    },
    locationAddress: {
        fontSize: 13,
        color: "#666",
    },
    routeLine: {
        width: 2,
        height: 24,
        backgroundColor: "#ddd",
        marginLeft: 15,
        marginVertical: 8,
    },
    rideTypeRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    rideTypeIcon: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: "#FFF9F0",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    rideTypeInfo: {
        flex: 1,
    },
    rideTypeName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#333",
        marginBottom: 4,
    },
    rideTypeMeta: {
        fontSize: 14,
        color: "#666",
    },
    driverRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    driverAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#D0BB95",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    driverInfo: {
        flex: 1,
    },
    driverName: {
        fontSize: 18,
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
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
        marginLeft: 4,
    },
    driverVehicle: {
        fontSize: 13,
        color: "#666",
    },
    callButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#F0FFF4",
        justifyContent: "center",
        alignItems: "center",
    },
    fareRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    fareLabel: {
        fontSize: 14,
        color: "#666",
    },
    fareValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
    },
    fareDivider: {
        height: 1,
        backgroundColor: "#eee",
        marginVertical: 8,
    },
    fareTotalLabel: {
        fontSize: 16,
        fontWeight: "700",
        color: "#333",
    },
    fareTotalValue: {
        fontSize: 24,
        fontWeight: "800",
        color: "#D0BB95",
    },
    paymentNote: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFF9F0",
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
    },
    paymentNoteText: {
        fontSize: 13,
        color: "#666",
        marginLeft: 8,
        flex: 1,
    },
    noteCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 14,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "#eee",
    },
    noteText: {
        fontSize: 14,
        color: "#666",
        marginLeft: 12,
        flex: 1,
    },
    buttonContainer: {
        paddingHorizontal: 16,
        marginTop: 8,
    },
    confirmButton: {
        flexDirection: "row",
        backgroundColor: "#D0BB95",
        padding: 18,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        shadowColor: "#D0BB95",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    confirmButtonText: {
        fontSize: 18,
        fontWeight: "800",
        color: "#fff",
        marginRight: 8,
    },
    cancelButton: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#eee",
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#666",
    },
});