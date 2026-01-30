import { useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
// import { socketService } from '@/services/socketService'; // keeping dynamic require as per original for safety

export const usePaymentSocket = (booking: any) => {
    useEffect(() => {
        // Dynamic import to match original behavior and avoid init issues
        const { socketService } = require('../../../../services/socketService');
        const socket = socketService.getSocket();

        if (socket) {
            const handlePaymentUpdate = (data: any) => {
                const bookingId = booking?._id || booking?.id;
                if (data.bookingId === bookingId) {
                    Alert.alert(
                        "Payment Received",
                        `Received ₹${data.amount} via Online Payment.`,
                        [
                            {
                                text: "Great!",
                                onPress: async () => {
                                    await AsyncStorage.removeItem('driverActiveBookingId');
                                    router.replace('/driver/tabs/dashboard');
                                }
                            }
                        ]
                    );
                }
            };

            socket.on('payment:received', handlePaymentUpdate);

            return () => {
                socket.off('payment:received', handlePaymentUpdate);
            };
        }
    }, [booking]);
};
