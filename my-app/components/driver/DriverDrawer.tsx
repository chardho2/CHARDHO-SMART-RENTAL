import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View, Image, Alert } from "react-native";
import driverAPI, { DriverProfile } from "../../services/driverAPI";
import { useDriverApp } from "../../context/DriverAppContext";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";

export default function DriverDrawer() {
    const { logout } = useAuth();
    const { isOnline, toggleOnline } = useDriverApp();
    const { colors, darkMode } = useSettings();
    const [driver, setDriver] = useState<DriverProfile | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const response = await driverAPI.getProfile();
            if (response.success && response.driver) {
                setDriver(response.driver);
            }
        } catch (error) {
            console.log('Error loading driver profile in drawer:', error);
        }
    };

    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        text: { color: colors.text },
        subText: { color: colors.subText },
        menuItem: { backgroundColor: darkMode ? '#1E1E1E' : '#fff' }, // Optional: separate background for items
        iconColor: darkMode ? '#ccc' : '#8b6f46'
    };

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                    await logout();
                    router.replace("/login");
                },
            },
        ]);
    };

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <View style={styles.profile}>
                {driver?.profilePicture ? (
                    <Image source={{ uri: driver.profilePicture }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, { backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center' }]}>
                        <MaterialIcons name="person" size={34} color={colors.subText} />
                    </View>
                )}
                <Text style={[styles.name, dynamicStyles.text]}>{driver?.name || 'Driver'}</Text>
                <Text style={styles.status}>{isOnline ? "Online" : "Offline"}</Text>
            </View>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/driver/tabs/dashboard")}>
                <MaterialIcons name="dashboard" size={20} color={dynamicStyles.iconColor} />
                <Text style={[styles.menuText, dynamicStyles.text]}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/driver/tabs/earnings")}>
                <MaterialCommunityIcons name="currency-usd" size={20} color={dynamicStyles.iconColor} />
                <Text style={[styles.menuText, dynamicStyles.text]}>Earnings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/driver/tabs/trips")}>
                <MaterialIcons name="history" size={20} color={dynamicStyles.iconColor} />
                <Text style={[styles.menuText, dynamicStyles.text]}>Trips</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/driver/tabs/profile")}>
                <MaterialIcons name="person" size={20} color={dynamicStyles.iconColor} />
                <Text style={[styles.menuText, dynamicStyles.text]}>Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/driver/notifications")}>
                <MaterialIcons name="notifications" size={20} color={dynamicStyles.iconColor} />
                <Text style={[styles.menuText, dynamicStyles.text]}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/driver/wallet")}>
                <MaterialCommunityIcons name="wallet" size={20} color={dynamicStyles.iconColor} />
                <Text style={[styles.menuText, dynamicStyles.text]}>Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.bottomBtn} onPress={handleLogout}>
                <MaterialIcons name="logout" size={20} color={dynamicStyles.iconColor} />
                <Text style={[styles.menuText, dynamicStyles.text, { marginLeft: 8 }]}>Logout</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
                <Text style={[{ flex: 1, fontSize: 16, fontWeight: "700" }, dynamicStyles.text]}>
                    {isOnline ? "Online" : "Offline"}
                </Text>
                <Switch
                    value={isOnline}
                    onValueChange={toggleOnline}
                    trackColor={{ false: "#767577", true: "#4FD1C5" }}
                    thumbColor={isOnline ? "#fff" : "#f4f3f4"}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", paddingTop: 40, paddingHorizontal: 14 },
    profile: { alignItems: "center", marginBottom: 24 },
    avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: "#ddd" },
    name: { fontSize: 18, fontWeight: "700", marginTop: 8 },
    status: { color: "#0a8a5a", marginTop: 4 },

    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderRadius: 8,
        paddingHorizontal: 8,
        gap: 12,
    },
    menuText: { fontSize: 16, color: "#222", marginLeft: 8 },

    sosBtn: {
        marginTop: "auto",
        backgroundColor: "#e53935",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    sosText: { color: "#fff", fontWeight: "800" },

    bottomBtn: { flexDirection: "row", alignItems: "center", paddingVertical: 16 },
});
