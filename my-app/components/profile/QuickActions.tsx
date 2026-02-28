import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSettings } from "../../context/SettingsContext";

export default function QuickActions() {
    const { colors } = useSettings();

    const dynamicStyles = {
        text: { color: colors.text },
        subText: { color: colors.subText },
        card: { backgroundColor: colors.card },
    };

    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
                <TouchableOpacity
                    style={[styles.quickActionCard, dynamicStyles.card]}
                    onPress={() => router.push("/booking" as any)}
                >
                    <View style={[styles.quickActionIcon, { backgroundColor: "#4caf5015" }]}>
                        <Ionicons name="add-circle" size={28} color="#4caf50" />
                    </View>
                    <Text style={[styles.quickActionText, dynamicStyles.subText]}>Book Ride</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.quickActionCard, dynamicStyles.card]}>
                    <View style={[styles.quickActionIcon, { backgroundColor: "#2196f315" }]}>
                        <Ionicons name="gift" size={28} color="#2196f3" />
                    </View>
                    <Text style={[styles.quickActionText, dynamicStyles.subText]}>Offers</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.quickActionCard, dynamicStyles.card]}>
                    <View style={[styles.quickActionIcon, { backgroundColor: "#9c27b015" }]}>
                        <Ionicons name="people" size={28} color="#9c27b0" />
                    </View>
                    <Text style={[styles.quickActionText, dynamicStyles.subText]}>Refer</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        padding: 16,
        paddingTop: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1a1a1a",
        marginBottom: 12,
    },
    quickActionsGrid: {
        flexDirection: "row",
        gap: 12,
    },
    quickActionCard: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 12,
        alignItems: "center",
        elevation: 1,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    quickActionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 6,
    },
    quickActionText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#666",
    },
});
