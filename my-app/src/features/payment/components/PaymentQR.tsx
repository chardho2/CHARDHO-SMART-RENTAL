import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface PaymentQRProps {
    fareAmount: number;
    colors: any;
}

export const PaymentQR: React.FC<PaymentQRProps> = ({ fareAmount, colors }) => {
    // Mock UPI ID for the company
    const upiId = "chardhogo@upi";
    const upiName = "CharDhoGo Payments";
    const qrData = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${fareAmount}&cu=INR`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}`;

    const dynamicStyles = {
        card: { backgroundColor: colors.card },
        text: { color: colors.text },
        subText: { color: colors.subText },
    };

    return (
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
    );
};

const styles = StyleSheet.create({
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
});
