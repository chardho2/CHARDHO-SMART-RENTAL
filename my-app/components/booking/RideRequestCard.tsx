import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

interface RideRequestCardProps {
    visible: boolean;
    booking: {
        bookingId: string;
        user: {
            name: string;
            phone: string;
        };
        pickup: {
            name: string;
            address: string;
        };
        destination: {
            name: string;
            address: string;
        };
        rideType: string;
        fare: number;
        distance?: string;
        estimatedTime?: number;
    };
    onAccept: () => void;
    onReject: () => void;
    autoRejectTime?: number; // seconds
}

export default function RideRequestCard({
    visible,
    booking,
    onAccept,
    onReject,
    autoRejectTime = 30
}: RideRequestCardProps) {
    const [timeLeft, setTimeLeft] = useState(autoRejectTime);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(300));

    useEffect(() => {
        if (visible) {
            // Animate in
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 50,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();

            // Start countdown
            setTimeLeft(autoRejectTime);
            const interval = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        onReject(); // Auto-reject when time runs out
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(interval);
        } else {
            // Animate out
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 300,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    if (!visible) return null;

    const getRideIcon = (type: string) => {
        switch (type) {
            case 'bike': return 'two-wheeler';
            case 'auto': return 'local-taxi';
            case 'car': return 'directions-car';
            case 'suv': return 'airport-shuttle';
            default: return 'directions-car';
        }
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onReject}
        >
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
                    {/* Header with timer */}
                    <LinearGradient
                        colors={['#4FD1C5', '#38B2AC']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.header}
                    >
                        <View style={styles.headerContent}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="notifications" size={24} color="#fff" />
                            </View>
                            <View style={styles.headerText}>
                                <Text style={styles.headerTitle}>New Ride Request</Text>
                                <Text style={styles.headerSubtitle}>Respond quickly to accept</Text>
                            </View>
                        </View>
                        <View style={styles.timerContainer}>
                            <Text style={styles.timerText}>{timeLeft}s</Text>
                        </View>
                    </LinearGradient>

                    {/* User Info */}
                    <View style={styles.section}>
                        <View style={styles.userInfo}>
                            <View style={styles.avatar}>
                                <Ionicons name="person" size={24} color="#4FD1C5" />
                            </View>
                            <View style={styles.userDetails}>
                                <Text style={styles.userName}>{booking.user.name}</Text>
                                <Text style={styles.userPhone}>{booking.user.phone}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Trip Details */}
                    <View style={styles.section}>
                        {/* Pickup */}
                        <View style={styles.locationRow}>
                            <View style={styles.locationIcon}>
                                <View style={styles.pickupDot} />
                            </View>
                            <View style={styles.locationInfo}>
                                <Text style={styles.locationLabel}>Pickup</Text>
                                <Text style={styles.locationName}>{booking.pickup.name}</Text>
                                <Text style={styles.locationAddress}>{booking.pickup.address}</Text>
                            </View>
                        </View>

                        {/* Connector */}
                        <View style={styles.connector} />

                        {/* Destination */}
                        <View style={styles.locationRow}>
                            <View style={styles.locationIcon}>
                                <Ionicons name="location" size={20} color="#667eea" />
                            </View>
                            <View style={styles.locationInfo}>
                                <Text style={styles.locationLabel}>Destination</Text>
                                <Text style={styles.locationName}>{booking.destination.name}</Text>
                                <Text style={styles.locationAddress}>{booking.destination.address}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Ride Info */}
                    <View style={styles.rideInfo}>
                        <View style={styles.infoItem}>
                            <MaterialIcons name={getRideIcon(booking.rideType)} size={20} color="#666" />
                            <Text style={styles.infoText}>{booking.rideType.toUpperCase()}</Text>
                        </View>
                        {booking.distance && (
                            <View style={styles.infoItem}>
                                <Ionicons name="navigate" size={20} color="#666" />
                                <Text style={styles.infoText}>{booking.distance}</Text>
                            </View>
                        )}
                        {booking.estimatedTime && (
                            <View style={styles.infoItem}>
                                <Ionicons name="time" size={20} color="#666" />
                                <Text style={styles.infoText}>{booking.estimatedTime} min</Text>
                            </View>
                        )}
                    </View>

                    {/* Fare */}
                    <View style={styles.fareContainer}>
                        <Text style={styles.fareLabel}>Estimated Fare</Text>
                        <Text style={styles.fareAmount}>₹{booking.fare}</Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={styles.rejectButton}
                            onPress={onReject}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.rejectText}>Reject</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.acceptButtonContainer}
                            onPress={onAccept}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#4FD1C5', '#38B2AC']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.acceptButton}
                            >
                                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                                <Text style={styles.acceptText}>Accept Ride</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.3,
                shadowRadius: 20,
                shadowOffset: { width: 0, height: 10 },
            },
            android: {
                elevation: 10,
            },
        }),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 2,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    timerContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    timerText: {
        fontSize: 16,
        fontWeight: '900',
        color: '#fff',
    },
    section: {
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: 'rgba(79, 209, 197, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    userPhone: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    locationIcon: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    pickupDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4FD1C5',
        borderWidth: 3,
        borderColor: 'rgba(79, 209, 197, 0.3)',
    },
    connector: {
        width: 2,
        height: 20,
        backgroundColor: '#e0e0e0',
        marginLeft: 15,
        marginVertical: 4,
    },
    locationInfo: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 12,
        color: '#999',
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    locationName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 2,
    },
    locationAddress: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    rideInfo: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        backgroundColor: '#f9f9f9',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    fareContainer: {
        padding: 20,
        alignItems: 'center',
        backgroundColor: 'rgba(79, 209, 197, 0.05)',
    },
    fareLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
        marginBottom: 4,
    },
    fareAmount: {
        fontSize: 32,
        fontWeight: '900',
        color: '#4FD1C5',
    },
    actions: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
    },
    rejectButton: {
        flex: 1,
        paddingVertical: 16,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    rejectText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#666',
    },
    acceptButtonContainer: {
        flex: 2,
        borderRadius: 12,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#4FD1C5',
                shadowOpacity: 0.4,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
            },
            android: {
                elevation: 6,
            },
        }),
    },
    acceptButton: {
        flexDirection: 'row',
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    acceptText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#fff',
    },
});
