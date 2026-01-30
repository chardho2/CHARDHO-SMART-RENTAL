import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { useSettings } from '../../../../context/SettingsContext';
import { usePaymentSocket } from '../hooks/usePaymentSocket';
import { usePaymentVerification } from '../hooks/usePaymentVerification';

import { PaymentHeader } from '../components/PaymentHeader';
import { FareCard } from '../components/FareCard';
import { PaymentQR } from '../components/PaymentQR';

interface PaymentCollectedScreenProps {
    booking: any;
}

export const PaymentCollectedScreen: React.FC<PaymentCollectedScreenProps> = ({ booking }) => {
    const { colors } = useSettings();

    // Hooks
    usePaymentSocket(booking);
    const { isVerifying, handlePaymentReceived } = usePaymentVerification(booking);

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

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <PaymentHeader />

            <ScrollView
                style={styles.content}
                contentContainerStyle={{ paddingBottom: 30 }}
                showsVerticalScrollIndicator={false}
            >
                <FareCard booking={booking} colors={colors} />

                <PaymentQR fareAmount={fareAmount} colors={colors} />

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
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 20,
        marginTop: -30,
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
