import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSettings } from '../../context/SettingsContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { bookingAPI } from '../../services/bookingAPI';
// storageService import removed or kept if needed for other things

export default function PaymentCollected() {
    const { bookingData } = useLocalSearchParams<{ bookingData: string }>();
    const { colors, darkMode } = useSettings();
    const booking = bookingData ? JSON.parse(bookingData) : null;

    if (!booking) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={{ color: colors.text }}>Error: No Booking Data</Text>
                <TouchableOpacity onPress={() => router.replace('/driver/tabs/dashboard')}>
                    <Text style={{ color: colors.primary }}>Go to Dashboard</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const fareAmount = booking.fare?.total || 0;
    // Mock UPI ID for the company
    const upiId = "chardhogo@upi";
    const upiName = "CharDhoGo Payments";
    const qrData = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${fareAmount}&cu=INR`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;

    const [isVerifying, setIsVerifying] = React.useState(false);

    const handlePaymentReceived = async () => {
        try {
            setIsVerifying(true);

            // ⭐ CRITICAL: Verify payment before crediting wallet
            // This prevents crediting when user hasn't actually paid

            const paymentMethod = booking.payment?.method || 'cash';

            // For cash payments, no verification needed
            if (paymentMethod === 'cash') {
                Alert.alert(
                    "Payment Confirmed",
                    "Cash payment received. Earnings have been credited to your wallet.",
                    [
                        {
                            text: "OK",
                            onPress: async () => {
                                await AsyncStorage.removeItem('driverActiveBookingId');
                                router.replace('/driver/tabs/dashboard');
                            }
                        }
                    ]
                );
                return;
            }

            // For online payments (UPI/PhonePe/QR), verify with backend
            console.log('⚠️ Online payment detected - verifying with backend...');

            // The backend will check if payment was actually received
            // This happens in the complete endpoint which was already called
            // We just need to check the current payment status

            const bookingId = booking._id || booking.id;
            const response = await bookingAPI.getBooking(bookingId);

            if (!response.success) {
                throw new Error(response.message || 'Failed to verify payment');
            }

            const updatedBooking = response.booking;

            // Check if payment is completed
            if (updatedBooking.payment?.status === 'completed') {
                // ✅ Payment verified
                Alert.alert(
                    "Payment Confirmed",
                    "Payment verified successfully. Earnings have been credited to your wallet.",
                    [
                        {
                            text: "OK",
                            onPress: async () => {
                                await AsyncStorage.removeItem('driverActiveBookingId');
                                router.replace('/driver/tabs/dashboard');
                            }
                        }
                    ]
                );
            } else {
                // ❌ Payment not verified
                Alert.alert(
                    "Payment Not Received",
                    "The user has not completed the online payment yet.\n\nPlease ask the user to:\n1. Scan the QR code\n2. Complete the payment\n\nOr switch to cash payment.",
                    [
                        {
                            text: "Switch to Cash",
                            onPress: () => handleSwitchToCash(bookingId)
                        },
                        {
                            text: "Wait for Payment",
                            onPress: () => {
                                Alert.alert(
                                    "Waiting for Payment",
                                    "Ask the user to complete the payment, then try again.",
                                    [{ text: "OK" }]
                                );
                            }
                        },
                        {
                            text: "Cancel",
                            style: "cancel"
                        }
                    ]
                );
            }
        } catch (error: any) {
            console.error('Payment verification error:', error);
            Alert.alert(
                "Verification Error",
                error.message || "Unable to verify payment. Please try again or switch to cash.",
                [
                    {
                        text: "Switch to Cash",
                        onPress: () => handleSwitchToCash(booking._id || booking.id)
                    },
                    {
                        text: "Retry",
                        onPress: () => handlePaymentReceived()
                    },
                    {
                        text: "Cancel",
                        style: "cancel"
                    }
                ]
            );
        } finally {
            setIsVerifying(false);
        }
    };

    const handleSwitchToCash = async (bookingId: string) => {
        try {
            setIsVerifying(true);

            // Call API to switch payment method to cash
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.4:4000'}/api/payment/switch-to-cash`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await AsyncStorage.getItem('driverToken')}`
                },
                body: JSON.stringify({ bookingId })
            });

            const data = await response.json();

            if (data.success) {
                Alert.alert(
                    "Payment Method Changed",
                    "Payment method switched to cash. Please collect cash from the user.",
                    [
                        {
                            text: "OK",
                            onPress: async () => {
                                // Now mark as received (cash payment)
                                await AsyncStorage.removeItem('driverActiveBookingId');
                                router.replace('/driver/tabs/dashboard');
                            }
                        }
                    ]
                );
            } else {
                throw new Error(data.message || 'Failed to switch payment method');
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to switch to cash payment");
        } finally {
            setIsVerifying(false);
        }
    };

    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        card: { backgroundColor: colors.card },
        text: { color: colors.text },
        subText: { color: colors.subText },
        divider: { backgroundColor: colors.border }
    };

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <LinearGradient
                colors={['#4FD1C5', '#38B2AC']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.successIcon}>
                    <Ionicons name="checkmark" size={40} color="#fff" />
                </View>
                <Text style={styles.headerTitle}>Trip Completed!</Text>
                <Text style={styles.headerSubtitle}>Collect payment from passenger</Text>
            </LinearGradient>

            <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
                {/* Fare Card */}
                <View style={[styles.fareCard, dynamicStyles.card]}>
                    <Text style={[styles.fareLabel, dynamicStyles.subText]}>TOTAL FARE</Text>
                    <Text style={styles.fareAmount}>₹{fareAmount.toFixed(2)}</Text>

                    <View style={[styles.divider, dynamicStyles.divider]} />

                    <View style={styles.breakdownRow}>
                        <Text style={dynamicStyles.subText}>Base Fare</Text>
                        <Text style={dynamicStyles.text}>₹{booking.fare?.baseFare || 0}</Text>
                    </View>
                    <View style={styles.breakdownRow}>
                        <Text style={dynamicStyles.subText}>Distance</Text>
                        <Text style={dynamicStyles.text}>₹{booking.fare?.distanceCharge || 0}</Text>
                    </View>
                </View>

                {/* QR Code Section */}
                <View style={[styles.qrSection, dynamicStyles.card]}>
                    <Text style={[styles.scanLabel, dynamicStyles.text]}>Scan to Pay</Text>
                    <View style={styles.qrContainer}>
                        <Image
                            source={{ uri: qrImageUrl }}
                            style={styles.qrImage}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={[styles.upiLabel, dynamicStyles.subText]}>{upiId}</Text>
                </View>

                <TouchableOpacity
                    style={[styles.confirmBtn, isVerifying && { opacity: 0.6 }]}
                    onPress={handlePaymentReceived}
                    disabled={isVerifying}
                >
                    <LinearGradient
                        colors={isVerifying ? ['#ccc', '#aaa'] : ['#4FD1C5', '#38B2AC']}
                        style={styles.btnGradient}
                    >
                        {isVerifying ? (
                            <>
                                <ActivityIndicator color="#fff" style={{ marginRight: 10 }} />
                                <Text style={styles.btnText}>Verifying Payment...</Text>
                            </>
                        ) : (
                            <Text style={styles.btnText}>Payment Received</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingTop: 40,
    },
    successIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 5,
    },
    content: {
        flex: 1,
        padding: 20,
        marginTop: -30,
    },
    fareCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        alignItems: 'center',
    },
    fareLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 5,
        letterSpacing: 1,
    },
    fareAmount: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#4FD1C5',
    },
    divider: {
        height: 1,
        width: '100%',
        marginVertical: 15,
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 5,
    },
    qrSection: {
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        elevation: 2,
        marginBottom: 20,
    },
    scanLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 15,
    },
    qrContainer: {
        padding: 10,
        backgroundColor: '#fff',
        borderRadius: 10,
        elevation: 2,
    },
    qrImage: {
        width: 180,
        height: 180,
    },
    upiLabel: {
        marginTop: 10,
        fontSize: 12,
    },
    confirmBtn: {
        marginTop: 'auto',
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 5,
    },
    btnGradient: {
        padding: 18,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    btnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
