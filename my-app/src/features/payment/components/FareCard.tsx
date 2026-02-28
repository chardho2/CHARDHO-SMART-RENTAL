import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FareCardProps {
    booking: any;
    colors: any;
}

export const FareCard: React.FC<FareCardProps> = ({ booking, colors }) => {
    const fareAmount = booking?.fare?.total || 0;

    const dynamicStyles = {
        card: { backgroundColor: colors.card },
        text: { color: colors.text },
        subText: { color: colors.subText },
        divider: { backgroundColor: colors.border }
    };

    return (
        <View style={[styles.fareCard, dynamicStyles.card]}>
            <Text style={[styles.fareLabel, dynamicStyles.subText]}>TOTAL FARE</Text>
            <Text style={styles.fareAmount}>₹{fareAmount.toFixed(2)}</Text>

            <View style={[styles.divider, dynamicStyles.divider]} />

            <View style={styles.breakdownRow}>
                <Text style={dynamicStyles.subText}>Base Fare</Text>
                <Text style={dynamicStyles.text}>₹{booking?.fare?.baseFare || 0}</Text>
            </View>
            <View style={styles.breakdownRow}>
                <Text style={dynamicStyles.subText}>Distance</Text>
                <Text style={dynamicStyles.text}>₹{booking?.fare?.distanceCharge || 0}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
});
