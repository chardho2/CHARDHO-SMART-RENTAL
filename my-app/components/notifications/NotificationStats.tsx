import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSettings } from "../../context/SettingsContext";

interface NotificationStatsData {
    total: number;
    unread: number;
    read: number;
}

interface NotificationStatsProps {
    stats: NotificationStatsData | null;
}

export default function NotificationStats({ stats }: NotificationStatsProps) {
    const { colors } = useSettings();

    const dynamicStyles = {
        card: { backgroundColor: colors.card, borderColor: colors.border },
        text: { color: colors.text },
        subText: { color: colors.subText },
    };

    if (!stats) return null;

    return (
        <View style={styles.statsContainer}>
            <View style={[styles.statCard, dynamicStyles.card]}>
                <Text style={[styles.statValue, dynamicStyles.text]}>{stats.total}</Text>
                <Text style={[styles.statLabel, dynamicStyles.subText]}>Total</Text>
            </View>
            <View style={[styles.statCard, dynamicStyles.card]}>
                <Text style={[styles.statValue, { color: '#FF9800' }]}>{stats.unread}</Text>
                <Text style={[styles.statLabel, dynamicStyles.subText]}>Unread</Text>
            </View>
            <View style={[styles.statCard, dynamicStyles.card]}>
                <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.read}</Text>
                <Text style={[styles.statLabel, dynamicStyles.subText]}>Read</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    statsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: '#fff',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    statValue: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 4,
        color: '#1a1a1a',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
    },
});
