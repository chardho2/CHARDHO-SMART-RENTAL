import { useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { PaymentService } from '../services/payment.api';

export const usePaymentVerification = (booking: any) => {
    const [isVerifying, setIsVerifying] = useState(false);

    const bookingId = booking?._id || booking?.id;

    const onSuccess = async () => {
        await AsyncStorage.removeItem('driverActiveBookingId');
        router.replace('/driver/tabs/dashboard');
    };

    const verifyOnlinePayment = async () => {
        if (!bookingId) return;

        try {
            setIsVerifying(true);
            console.log('⚠️ Verifying online payment...');

            const response = await PaymentService.verifyOnlinePayment(bookingId);

            if (!response.success) {
                throw new Error(response.message || 'Failed to verify payment');
            }

            const updatedBooking = response.booking;

            if (updatedBooking.payment?.status === 'completed') {
                Alert.alert(
                    "Payment Verified",
                    "Online payment verified successfully. Earnings credited to your wallet.",
                    [{ text: "OK", onPress: onSuccess }]
                );
            } else {
                Alert.alert(
                    "Payment Not Found",
                    "We haven't received the online payment confirmation yet.\n\n• Ask user to complete payment\n• Or switch to Cash if they paid cash",
                    [
                        { text: "Check Again", onPress: () => verifyOnlinePayment() },
                        { text: "Switch to Cash", onPress: () => confirmCashPayment() },
                        { text: "Close", style: "cancel" }
                    ]
                );
            }
        } catch (error: any) {
            console.error('Payment verification error:', error);
            Alert.alert("Error", "Could not verify payment status. Please try again.");
        } finally {
            setIsVerifying(false);
        }
    };

    const confirmCashPayment = () => {
        const fareAmount = booking?.fare?.total || 0;
        Alert.alert(
            "Confirm Cash Payment",
            `Collect ₹${fareAmount.toFixed(2)} from the customer.`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Collected", onPress: () => handleSwitchToCash() }
            ]
        );
    };

    const handleSwitchToCash = async () => {
        if (!bookingId) return;

        try {
            setIsVerifying(true);
            const data = await PaymentService.switchToCash(bookingId);

            if (data.success) {
                Alert.alert(
                    "Payment Method Changed",
                    "Payment method switched to cash. Please collect cash from the user.",
                    [{ text: "OK", onPress: onSuccess }]
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

    const handlePaymentReceived = () => {
        Alert.alert(
            "Select Payment Method",
            "How did the customer pay?",
            [
                { text: "Cash", onPress: confirmCashPayment },
                { text: "Online (QR/UPI)", onPress: verifyOnlinePayment },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    return {
        isVerifying,
        handlePaymentReceived,
        verifyOnlinePayment,
        confirmCashPayment
    };
};
