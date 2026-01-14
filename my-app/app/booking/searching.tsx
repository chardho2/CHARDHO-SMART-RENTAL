import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, Alert, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { socketService } from "../../services/socketService";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { bookingAPI } from "../../services/bookingAPI";

export default function SearchingForDriver() {
    const { user } = useAuth();
    const { colors, darkMode } = useSettings();
    const [pickupName, setPickupName] = useState("Your Location");

    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        text: { color: colors.text },
        subText: { color: colors.subText },
        card: { backgroundColor: colors.card, borderColor: colors.border },
        step: { backgroundColor: colors.card },
    };

    useEffect(() => {
        loadBookingData();

        if (user?._id) {
            console.log("Connecting user to socket for booking updates:", user._id);
            socketService.connect(user._id, 'user');

            socketService.onBookingAccepted((data) => {
                console.log("Ride accepted by driver:", data);
                // Alert.alert("Ride Accepted", "Great news! A driver has accepted your request.");
                router.replace("/booking/live-ride");
            });

            socketService.onBookingRejected(async (data) => {
                console.log("Ride rejected by driver:", data);

                // Retrieve pending booking details to allow rebooking
                try {
                    const bookingStr = await AsyncStorage.getItem('pendingBooking');

                    // Verify if this rejection is for the CURRENT booking
                    const currentBookingId = await AsyncStorage.getItem('currentBookingId');
                    if (data.bookingId && currentBookingId && data.bookingId !== currentBookingId) {
                        console.log("Ignoring rejection for old booking:", data.bookingId);
                        return;
                    }

                    if (bookingStr) {
                        const booking = JSON.parse(bookingStr);

                        Alert.alert(
                            "Driver Unavailable",
                            "The driver declined the request. Would you like to try another driver?",
                            [
                                {
                                    text: "Cancel",
                                    style: "cancel",
                                    onPress: async () => {
                                        await AsyncStorage.removeItem('pendingBooking');
                                        await AsyncStorage.removeItem('currentBookingId');
                                        router.replace("/home");
                                    }
                                },
                                {
                                    text: "Try Again",
                                    onPress: () => {
                                        // Navigate back to booking with pre-filled details
                                        router.push({
                                            pathname: "/booking",
                                            params: {
                                                pickupName: booking.pickup?.name,
                                                pickupAddress: booking.pickup?.address,
                                                pickupLat: booking.pickup?.coordinates?.latitude || booking.pickup?.lat,
                                                pickupLng: booking.pickup?.coordinates?.longitude || booking.pickup?.lng,
                                                dropName: booking.destination?.name,
                                                dropAddress: booking.destination?.address,
                                                dropLat: booking.destination?.coordinates?.latitude || booking.destination?.lat,
                                                dropLng: booking.destination?.coordinates?.longitude || booking.destination?.lng,
                                            }
                                        } as any);
                                    }
                                }
                            ]
                        );
                        return;
                    }
                } catch (e) {
                    console.error("Error reading booking for retry:", e);
                }

                // Fallback if no data
                Alert.alert("No Drivers Found", "Sorry, the driver declined the request.");
                router.replace("/home");
            });
        }

        return () => {
            socketService.off('booking:accepted');
            socketService.off('booking:rejected');
        };
    }, [user?._id]);

    const loadBookingData = async () => {
        try {
            const bookingStr = await AsyncStorage.getItem('pendingBooking');
            if (bookingStr) {
                const booking = JSON.parse(bookingStr);
                setPickupName(booking.pickup?.name || "Your Location");
            }
        } catch (error) {
            console.error("Error loading pending booking for UI:", error);
        }
    };

    const handleCancelRide = () => {
        Alert.alert(
            "Cancel Request",
            "Are you sure you want to cancel your ride request?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const bookingId = await AsyncStorage.getItem('currentBookingId');
                            if (bookingId) {
                                await bookingAPI.cancelBooking(bookingId, 'User cancelled while searching');
                            }
                        } catch (error) {
                            console.error('Error cancelling booking:', error);
                        } finally {
                            await AsyncStorage.removeItem('currentBookingId');
                            await AsyncStorage.removeItem('pendingBooking');
                            router.replace("/home");
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
            <View style={styles.animationContainer}>
                <ActivityIndicator size="large" color="#4FD1C5" />
                <View style={[styles.pulseCircle, { transform: [{ scale: 1.5 }] }]} />
            </View>

            <Text style={[styles.title, dynamicStyles.text]}>Searching for Drivers...</Text>
            <Text style={[styles.subtitle, dynamicStyles.subText]}>Connecting you with the best available partner near you.</Text>

            <View style={[styles.infoCard, dynamicStyles.card]}>
                <View style={[styles.iconCircle, { backgroundColor: darkMode ? 'rgba(79, 209, 197, 0.2)' : 'rgba(79, 209, 197, 0.1)' }]}>
                    <MaterialIcons name="location-on" size={24} color="#4FD1C5" />
                </View>
                <View style={styles.infoTextContainer}>
                    <Text style={[styles.infoLabel, dynamicStyles.subText]}>PICKUP FROM</Text>
                    <Text style={[styles.infoText, dynamicStyles.text]} numberOfLines={1}>{pickupName}</Text>
                </View>
            </View>

            <View style={styles.waitingSteps}>
                <View style={[styles.step, dynamicStyles.step]}>
                    <MaterialIcons name="check-circle" size={20} color="#4FD1C5" />
                    <Text style={[styles.stepText, dynamicStyles.text]}>Request sent to drivers</Text>
                </View>
                <View style={[styles.step, dynamicStyles.step]}>
                    <ActivityIndicator size="small" color="#4FD1C5" style={{ marginRight: 8 }} />
                    <Text style={[styles.stepText, dynamicStyles.text]}>Waiting for driver to accept</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelRide}>
                <Text style={styles.cancelText}>Cancel Request</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // justifyContent: "center", // Changed from center to allow manual spacing
        alignItems: "center",
        backgroundColor: "#fff",
        padding: 24,
        paddingTop: 40, // Reduced from 80
    },
    animationContainer: {
        marginBottom: 20, // Reduced from 40
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10, // Reduced from 40
    },
    pulseCircle: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: 'rgba(79, 209, 197, 0.2)',
    },
    title: {
        fontSize: 26,
        fontWeight: "900",
        color: "#1a1a1a",
        marginBottom: 8, // Reduced from 12
        textAlign: 'center',
        marginTop: 10, // Reduced from 20
    },
    subtitle: {
        fontSize: 15,
        color: "#666",
        marginBottom: 30, // Reduced from 40
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    infoCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        padding: 20,
        borderRadius: 20,
        width: "100%",
        marginBottom: 40,
        borderWidth: 1,
        borderColor: "#eee",
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(79, 209, 197, 0.1)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    infoTextContainer: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: "800",
        color: "#999",
        letterSpacing: 1,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#333",
    },
    waitingSteps: {
        width: '100%',
        marginBottom: 40,
        gap: 16,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 8,
    },
    stepText: {
        fontSize: 15,
        color: '#444',
        fontWeight: '500',
        marginLeft: 12,
    },
    cancelBtn: {
        paddingVertical: 18,
        width: "100%",
        alignItems: "center",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#ff4d4f",
    },
    cancelText: {
        color: "#ff4d4f",
        fontWeight: "700",
        fontSize: 16,
    },
});
