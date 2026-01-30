import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSettings } from "../../context/SettingsContext";
import StatCard from "../../components/driver/StatCard";

interface UserStats {
    totalBookings: number;
    completedRides: number;
    cancelledRides: number;
    totalSpent: number;
    totalSavings: number;
    avgRatingGiven: number;
    favoriteRideType: string;
}

interface ProfileStatsProps {
    stats: UserStats | null;
}

export default function ProfileStats({ stats }: ProfileStatsProps) {
    const { colors } = useSettings();

    if (!stats) return null;

    const getRideTypeIcon = (type: string) => {
        switch (type) {
            case "bike":
                return "bicycle";
            case "auto":
                return "car-outline";
            case "car":
                return "car-sport";
            default:
                return "car";
        }
    };

    const dynamicStyles = {
        text: { color: colors.text },
    };

    return (
        <View style={styles.statsSection}>
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>Your Statistics</Text>
            <View style={styles.statsGrid}>
                <View style={styles.statRow}>
                    <StatCard
                        icon="car-sport"
                        title="Total Rides"
                        value={stats.totalBookings}
                        subtitle={`${stats.completedRides} completed`}
                        style={styles.statCard}
                    />
                </View>
                <View style={styles.statRow}>
                    <StatCard
                        icon="star"
                        iconColor="#ff9800"
                        title="Avg Rating"
                        value={stats.avgRatingGiven.toFixed(1)}
                        subtitle="Given to drivers"
                        style={styles.statCard}
                    />
                    <StatCard
                        icon={getRideTypeIcon(stats.favoriteRideType)}
                        iconColor="#2196f3"
                        title="Favorite"
                        value={(typeof stats.favoriteRideType === 'string' ? stats.favoriteRideType : 'Bike').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        subtitle="Most used ride"
                        style={styles.statCard}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    statsSection: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1a1a1a",
        marginBottom: 12,
    },
    statsGrid: {
        gap: 12,
    },
    statRow: {
        flexDirection: "row",
        gap: 12,
    },
    statCard: {
        flex: 1,
    },
});
