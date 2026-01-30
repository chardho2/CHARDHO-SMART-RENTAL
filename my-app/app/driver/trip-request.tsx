import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StatusBar,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from '../../components/map/MapComponents';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSettings } from '../../context/SettingsContext';
import api from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomMarker from '../../components/map/CustomMarker';

const { width, height } = Dimensions.get('window');

interface BookingDetails {
    _id: string;
    user: {
        _id: string;
        name: string;
        phone: string;
        rating?: number;
    };
    pickup: {
        name: string;
        address: string;
        coordinates: {
            latitude: number;
            longitude: number;
        };
    };
    destination: {
        name: string;
        address: string;
        coordinates: {
            latitude: number;
            longitude: number;
        };
    };
    rideType: {
        id: string;
        name: string;
        icon: string;
    };
    fare: {
        total: number;
        baseFare: number;
        distanceCharge: number;
        distance: number;
    };
    estimatedTime: number;
    status: string;
}

export default function TripRequest() {
    const { bookingId } = useLocalSearchParams();
    const { colors, darkMode } = useSettings();
    const [booking, setBooking] = useState<BookingDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [rejecting, setRejecting] = useState(false);

    useEffect(() => {
        if (bookingId) {
            loadBookingDetails();
        } else {
            Alert.alert('Error', 'No booking ID provided');
            router.back();
        }
    }, [bookingId]);

    const loadBookingDetails = async () => {
        try {
            setLoading(true);
            console.log('📥 Loading booking details for:', bookingId);

            const response = await api.get(`/booking/${bookingId}`);

            if (response.data.success) {
                setBooking(response.data.booking);
                console.log('✅ Booking loaded:', response.data.booking);
            } else {
                throw new Error(response.data.message || 'Failed to load booking');
            }
        } catch (error: any) {
            console.error('❌ Error loading booking:', error);
            Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to load ride request',
                [
                    {
                        text: 'Go Back',
                        onPress: () => router.back(),
                    },
                ]
            );
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!booking) return;

        // Alert.alert(
        //     'Accept Ride?',
        //     `Accept ride request from ${booking.user.name}?`,
        //     [
        //         {
        //             text: 'Cancel',
        //             style: 'cancel',
        //         },
        //         {
        //             text: 'Accept',
        //             onPress: async () => {
        try {
            setAccepting(true);
            console.log('✅ Accepting booking:', booking._id);

            const response = await api.patch(`/booking/${booking._id}/accept`);

            if (response.data.success) {
                // Store ID for persistence
                await AsyncStorage.setItem('driverActiveBookingId', booking._id);

                // Navigate directly without showing success alert
                // Use replace to remove trip-request from navigation stack
                router.replace({
                    pathname: '/driver/current-trip',
                    params: { bookingId: booking._id }
                } as any);
            } else {
                throw new Error(response.data.message || 'Failed to accept ride');
            }
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message || 'Failed to accept ride. Please try again.';

            if (status === 409 || status === 404) {
                console.log(`ℹ️ Ride unavailable (Status ${status}): ${message}`);
                Alert.alert(
                    'Ride Unavailable',
                    message,
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            } else {
                console.error('❌ Error accepting ride:', error);
                Alert.alert('Error', message);
            }
        } finally {
            setAccepting(false);
        }
        //             },
        //         },
        //     ]
        // );
    };

    const handleReject = async () => {
        if (!booking) return;

        Alert.alert(
            'Reject Ride?',
            'Are you sure you want to reject this ride request?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setRejecting(true);
                            console.log('❌ Rejecting booking:', booking._id);

                            const response = await api.patch(`/booking/${booking._id}/reject`);

                            if (response.data.success) {
                                // Alert.alert(
                                //     'Info',
                                //     response.data.message || 'Ride request rejected.',
                                //     [
                                //         {
                                //             text: 'OK',
                                //             onPress: () => router.back(),
                                //         },
                                //     ]
                                // );
                                router.back();
                            } else {
                                throw new Error(response.data.message || 'Failed to reject ride');
                            }
                        } catch (error: any) {
                            const status = error.response?.status;
                            const message = error.response?.data?.message || 'Failed to reject ride. Please try again.';

                            if (status === 409 || status === 404) {
                                console.log(`ℹ️ Ride unavailable (Status ${status}): ${message}`);
                                Alert.alert(
                                    'Ride Unavailable',
                                    message,
                                    [{ text: 'OK', onPress: () => router.back() }]
                                );
                            } else {
                                console.error('❌ Error rejecting ride:', error);
                                Alert.alert('Error', message);
                            }
                        } finally {
                            setRejecting(false);
                        }
                    },
                },
            ]
        );
    };

    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        card: { backgroundColor: colors.card },
        text: { color: colors.text },
        subText: { color: colors.subText },
    };

    if (loading) {
        return (
            <View style={[styles.container, dynamicStyles.container, styles.centered]}>
                <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
                <ActivityIndicator size="large" color="#4FD1C5" />
                <Text style={[styles.loadingText, dynamicStyles.text]}>Loading ride request...</Text>
            </View>
        );
    }

    if (!booking) {
        return (
            <View style={[styles.container, dynamicStyles.container, styles.centered]}>
                <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
                <MaterialIcons name="error-outline" size={64} color={colors.subText} />
                <Text style={[styles.errorText, dynamicStyles.text]}>Ride request not found</Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

            {/* Map */}
            <MapView
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={{
                    latitude: booking.pickup.coordinates.latitude,
                    longitude: booking.pickup.coordinates.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                customMapStyle={darkMode ? mapDarkStyle : []}
            >
                {/* Pickup Marker */}
                <Marker
                    coordinate={{
                        latitude: booking.pickup.coordinates.latitude,
                        longitude: booking.pickup.coordinates.longitude,
                    }}
                    title="Pickup"
                    description={booking.pickup.name}
                    anchor={{ x: 0.5, y: 1 }} // Anchor at bottom center for pins
                >
                    <CustomMarker type="pickup" />
                </Marker>

                {/* Destination Marker */}
                <Marker
                    coordinate={{
                        latitude: booking.destination.coordinates.latitude,
                        longitude: booking.destination.coordinates.longitude,
                    }}
                    title="Destination"
                    description={booking.destination.name}
                    anchor={{ x: 0.5, y: 1 }} // Anchor at bottom center for pins
                >
                    <CustomMarker type="destination" />
                </Marker>

                {/* Route Line */}
                <Polyline
                    coordinates={[
                        {
                            latitude: booking.pickup.coordinates.latitude,
                            longitude: booking.pickup.coordinates.longitude,
                        },
                        {
                            latitude: booking.destination.coordinates.latitude,
                            longitude: booking.destination.coordinates.longitude,
                        },
                    ]}
                    strokeColor="#4FD1C5"
                    strokeWidth={3}
                    lineDashPattern={[5, 5]}
                />
            </MapView>

            {/* Content Card */}
            <View style={styles.contentContainer}>
                <LinearGradient
                    colors={darkMode ? ['rgba(0,0,0,0.95)', 'rgba(0,0,0,0.9)'] : ['rgba(255,255,255,0.98)', 'rgba(255,255,255,0.95)']}
                    style={styles.contentCard}
                >
                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={[styles.title, dynamicStyles.text]}>New Ride Request</Text>
                            <View style={styles.rideTypeContainer}>
                                <MaterialIcons name={booking.rideType.icon as any} size={20} color="#4FD1C5" />
                                <Text style={[styles.rideType, { color: '#4FD1C5' }]}>{booking.rideType.name}</Text>
                            </View>
                        </View>

                        {/* User Info */}
                        <View style={[styles.section, dynamicStyles.card]}>
                            <View style={styles.userInfo}>
                                <View style={styles.avatar}>
                                    <MaterialIcons name="person" size={32} color="#4FD1C5" />
                                </View>
                                <View style={styles.userDetails}>
                                    <Text style={[styles.userName, dynamicStyles.text]}>{booking.user.name}</Text>
                                    <View style={styles.ratingContainer}>
                                        <MaterialIcons name="star" size={16} color="#FFD700" />
                                        <Text style={[styles.rating, dynamicStyles.subText]}>
                                            {booking.user.rating?.toFixed(1) || '5.0'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Trip Details */}
                        <View style={[styles.section, dynamicStyles.card]}>
                            <View style={styles.locationRow}>
                                <View style={styles.locationDot} />
                                <View style={styles.locationInfo}>
                                    <Text style={[styles.locationLabel, dynamicStyles.subText]}>Pickup</Text>
                                    <Text style={[styles.locationName, dynamicStyles.text]}>{booking.pickup.name}</Text>
                                    <Text style={[styles.locationAddress, dynamicStyles.subText]} numberOfLines={1}>
                                        {booking.pickup.address}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.locationDivider} />

                            <View style={styles.locationRow}>
                                <View style={[styles.locationDot, { backgroundColor: '#F56565' }]} />
                                <View style={styles.locationInfo}>
                                    <Text style={[styles.locationLabel, dynamicStyles.subText]}>Destination</Text>
                                    <Text style={[styles.locationName, dynamicStyles.text]}>{booking.destination.name}</Text>
                                    <Text style={[styles.locationAddress, dynamicStyles.subText]} numberOfLines={1}>
                                        {booking.destination.address}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Fare & Distance */}
                        <View style={[styles.section, dynamicStyles.card, styles.fareSection]}>
                            <View style={styles.fareRow}>
                                <View style={styles.fareItem}>
                                    <MaterialIcons name="route" size={20} color={colors.subText} />
                                    <Text style={[styles.fareLabel, dynamicStyles.subText]}>Distance</Text>
                                    <Text style={[styles.fareValue, dynamicStyles.text]}>
                                        {booking.fare.distance.toFixed(1)} km
                                    </Text>
                                </View>
                                <View style={styles.fareItem}>
                                    <MaterialIcons name="access-time" size={20} color={colors.subText} />
                                    <Text style={[styles.fareLabel, dynamicStyles.subText]}>Est. Time</Text>
                                    <Text style={[styles.fareValue, dynamicStyles.text]}>
                                        {booking.estimatedTime} min
                                    </Text>
                                </View>
                                <View style={styles.fareItem}>
                                    <MaterialIcons name="payments" size={20} color="#4FD1C5" />
                                    <Text style={[styles.fareLabel, dynamicStyles.subText]}>Fare</Text>
                                    <Text style={[styles.fareValue, { color: '#4FD1C5', fontSize: 20 }]}>
                                        ₹{booking.fare.total}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.button, styles.rejectButton]}
                                onPress={handleReject}
                                disabled={rejecting || accepting}
                            >
                                {rejecting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <MaterialIcons name="close" size={24} color="#fff" />
                                        <Text style={styles.buttonText}>Reject</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.button, styles.acceptButton]}
                                onPress={handleAccept}
                                disabled={accepting || rejecting}
                            >
                                {accepting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <MaterialIcons name="check" size={24} color="#fff" />
                                        <Text style={styles.buttonText}>Accept</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </LinearGradient>
            </View>
        </View>
    );
}

const mapDarkStyle = [
    { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
    { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
    { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centered: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    map: {
        width: width,
        height: height * 0.4,
    },
    markerContainer: {
        alignItems: 'center',
    },
    marker: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    contentContainer: {
        flex: 1,
        marginTop: -20,
    },
    contentCard: {
        flex: 1,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
        elevation: 10,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: -4 },
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
    },
    rideTypeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(79, 209, 197, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    rideType: {
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(79, 209, 197, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    rating: {
        fontSize: 14,
        fontWeight: '600',
    },
    locationRow: {
        flexDirection: 'row',
        gap: 12,
    },
    locationDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4FD1C5',
        marginTop: 4,
    },
    locationInfo: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    locationName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    locationAddress: {
        fontSize: 13,
    },
    locationDivider: {
        height: 20,
        width: 2,
        backgroundColor: '#E2E8F0',
        marginLeft: 5,
        marginVertical: 8,
    },
    fareSection: {
        padding: 20,
    },
    fareRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    fareItem: {
        alignItems: 'center',
        gap: 4,
    },
    fareLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    fareValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    rejectButton: {
        backgroundColor: '#F56565',
    },
    acceptButton: {
        backgroundColor: '#4FD1C5',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    backButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#4FD1C5',
        borderRadius: 12,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
