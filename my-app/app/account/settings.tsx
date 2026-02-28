import React, { useState, useEffect } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Alert,
    StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from "../../context/AuthContext";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSettings } from "../../context/SettingsContext";
import { userAPI } from "../../services/userAPI";
import SettingItem, { SettingItemProps } from "../../components/settings/SettingItem";

export default function Settings() {
    const { logout, user } = useAuth();
    const { colors, darkMode, toggleDarkMode } = useSettings();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [locationEnabled, setLocationEnabled] = useState(true);
    const [autoAcceptRides, setAutoAcceptRides] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const [notifications, location, autoAccept, sound] = await Promise.all([
                AsyncStorage.getItem('notifications_enabled'),
                AsyncStorage.getItem('location_enabled'),
                AsyncStorage.getItem('auto_accept_rides'),
                AsyncStorage.getItem('sound_enabled'),
            ]);

            if (notifications !== null) setNotificationsEnabled(notifications === 'true');
            if (location !== null) setLocationEnabled(location === 'true');
            if (autoAccept !== null) setAutoAcceptRides(autoAccept === 'true');
            if (sound !== null) setSoundEnabled(sound === 'true');
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const handleToggleNotifications = async (value: boolean) => {
        setNotificationsEnabled(value);
        await AsyncStorage.setItem('notifications_enabled', value.toString());
    };

    const handleToggleLocation = async (value: boolean) => {
        setLocationEnabled(value);
        await AsyncStorage.setItem('location_enabled', value.toString());
    };

    const handleToggleAutoAccept = async (value: boolean) => {
        setAutoAcceptRides(value);
        await AsyncStorage.setItem('auto_accept_rides', value.toString());
    };

    const handleToggleSound = async (value: boolean) => {
        setSoundEnabled(value);
        await AsyncStorage.setItem('sound_enabled', value.toString());
    };

    const handleClearCache = () => {
        Alert.alert(
            "Clear Cache",
            "This will clear all cached data. Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Clear specific cache keys, not auth tokens
                            const keysToKeep = ['auth_token', 'user_data', 'user_role'];
                            const allKeys = await AsyncStorage.getAllKeys();
                            const keysToRemove = allKeys.filter(key => !keysToKeep.includes(key));
                            await AsyncStorage.multiRemove(keysToRemove);
                            Alert.alert("Success", "Cache cleared successfully");
                        } catch (error) {
                            Alert.alert("Error", "Failed to clear cache");
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "This action cannot be undone. All your data will be permanently deleted. Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await userAPI.deleteAccount();
                            await logout();
                            router.replace("/login" as any);
                        } catch (error: any) {
                            Alert.alert("Error", error.message || "Failed to delete account");
                        }
                    }
                }
            ]
        );
    };

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                    await logout();
                    router.replace("/login" as any);
                },
            },
        ]);
    };

    const appSettings: SettingItemProps[] = [
        {
            id: '1',
            icon: 'notifications',
            title: 'Push Notifications',
            subtitle: 'Receive ride and payment alerts',
            type: 'toggle',
            value: notificationsEnabled,
            onToggle: handleToggleNotifications,
            color: '#FF9800'
        },
        {
            id: '2',
            icon: 'location',
            title: 'Location Services',
            subtitle: 'Required for ride tracking',
            type: 'toggle',
            value: locationEnabled,
            onToggle: handleToggleLocation,
            color: '#4CAF50'
        },
        {
            id: '3',
            icon: 'volume-high',
            title: 'Sound Effects',
            subtitle: 'Play sounds for notifications',
            type: 'toggle',
            value: soundEnabled,
            onToggle: handleToggleSound,
            color: '#2196F3'
        },
        {
            id: '4',
            icon: 'moon',
            title: 'Dark Mode',
            subtitle: 'Switch between light and dark theme',
            type: 'toggle',
            value: darkMode,
            onToggle: toggleDarkMode,
            color: '#9C27B0'
        },
    ];

    const rideSettings: SettingItemProps[] = [
        {
            id: '5',
            icon: 'checkmark-done',
            title: 'Auto Accept Rides',
            subtitle: 'Automatically accept incoming rides',
            type: 'toggle',
            value: autoAcceptRides,
            onToggle: handleToggleAutoAccept,
            color: '#00BCD4'
        },
    ];

    const accountSettings: SettingItemProps[] = [
        {
            id: '6',
            icon: 'person',
            title: 'Edit Profile',
            subtitle: 'Update your personal information',
            type: 'navigation',
            onPress: () => router.push(user?.userType === 'driver' ? '/driver/edit-profile' : '/account/edit-profile' as any),
            color: '#667eea'
        },
        {
            id: '7',
            icon: 'shield-checkmark',
            title: 'Privacy & Security',
            subtitle: 'Manage your privacy settings',
            type: 'navigation',
            onPress: () => Alert.alert("Coming Soon", "Privacy settings will be available soon"),
            color: '#4CAF50'
        },
        {
            id: '8',
            icon: 'language',
            title: 'Language',
            subtitle: 'English (US)',
            type: 'navigation',
            onPress: () => Alert.alert("Coming Soon", "Language selection will be available soon"),
            color: '#FF9800'
        },
    ];

    const otherSettings: SettingItemProps[] = [
        {
            id: '9',
            icon: 'document-text',
            title: 'Terms & Conditions',
            type: 'navigation',
            onPress: () => Alert.alert("Terms & Conditions", "View our terms and conditions"),
            color: '#607D8B'
        },
        {
            id: '10',
            icon: 'shield',
            title: 'Privacy Policy',
            type: 'navigation',
            onPress: () => Alert.alert("Privacy Policy", "View our privacy policy"),
            color: '#607D8B'
        },
        {
            id: '11',
            icon: 'information-circle',
            title: 'About',
            subtitle: 'CharDhoGo v1.0.0',
            type: 'navigation',
            onPress: () => Alert.alert("About", "CharDhoGo - Your trusted ride partner\nVersion 1.0.0"),
            color: '#607D8B'
        },
        {
            id: '12',
            icon: 'trash',
            title: 'Clear Cache',
            subtitle: 'Free up storage space',
            type: 'action',
            onPress: handleClearCache,
            color: '#FF5722'
        },
    ];

    const dangerZone: SettingItemProps[] = [
        {
            id: '13',
            icon: 'log-out',
            title: 'Logout',
            subtitle: 'Sign out of your account',
            type: 'action',
            onPress: handleLogout,
            color: '#f44336'
        },
        {
            id: '14',
            icon: 'trash-bin',
            title: 'Delete Account',
            subtitle: 'Permanently delete your account',
            type: 'action',
            onPress: handleDeleteAccount,
            color: '#D32F2F'
        },
    ];

    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        text: { color: colors.text },
    };

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

            {/* Header with Gradient */}
            <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>Settings</Text>
                        <Text style={styles.headerSubtitle}>Manage your preferences</Text>
                    </View>
                    <View style={styles.headerIcon}>
                        <Ionicons name="settings" size={28} color="#fff" />
                    </View>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* App Settings */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.text]}>App Settings</Text>
                    <View style={styles.settingsList}>
                        {appSettings.map((item) => (
                            <SettingItem key={item.id} {...item} />
                        ))}
                    </View>
                </View>

                {/* Ride Settings */}
                {user?.userType === 'driver' && (
                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, dynamicStyles.text]}>Ride Settings</Text>
                        <View style={styles.settingsList}>
                            {rideSettings.map((item) => (
                                <SettingItem key={item.id} {...item} />
                            ))}
                        </View>
                    </View>
                )}

                {/* Account Settings */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.text]}>Account</Text>
                    <View style={styles.settingsList}>
                        {accountSettings.map((item) => (
                            <SettingItem key={item.id} {...item} />
                        ))}
                    </View>
                </View>

                {/* Other Settings */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.text]}>Other</Text>
                    <View style={styles.settingsList}>
                        {otherSettings.map((item) => (
                            <SettingItem key={item.id} {...item} />
                        ))}
                    </View>
                </View>

                {/* Danger Zone */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: '#f44336' }]}>Danger Zone</Text>
                    <View style={styles.settingsList}>
                        {dangerZone.map((item) => (
                            <SettingItem key={item.id} {...item} />
                        ))}
                    </View>
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    headerIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 12,
    },
    settingsList: {
        gap: 12,
    },
    bottomPadding: {
        height: 24,
    },
});