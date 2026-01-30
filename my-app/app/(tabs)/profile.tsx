import React, { useState, useEffect } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    RefreshControl,
    Alert,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../context/AuthContext";
import { statsAPI } from "../../services/statsAPI";
import { userAPI } from "../../services/userAPI";
import { useSettings } from "../../context/SettingsContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ProfileCard from "../../components/profile/ProfileCard";
import ProfileStats from "../../components/profile/ProfileStats";
import QuickActions from "../../components/profile/QuickActions";
import MenuSection, { MenuItem } from "../../components/profile/MenuSection";
import EditProfileModal from "../../components/profile/EditProfileModal";

interface UserStats {
    totalBookings: number;
    completedRides: number;
    cancelledRides: number;
    totalSpent: number;
    totalSavings: number;
    avgRatingGiven: number;
    favoriteRideType: string;
    memberSince: string;
}

interface UserProfile {
    name: string;
    email?: string;
    phone?: string;
}

export default function UserProfileGateway() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [user, setUser] = useState<UserProfile | null>(null);
    const { logout } = useAuth();
    const { colors } = useSettings();

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [editType, setEditType] = useState<'name' | 'phone'>('name');
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        try {
            setLoading(true);

            // Check if user is logged in
            const token = await AsyncStorage.getItem("@chardhogo_token");
            if (!token) {
                router.replace("/login" as any);
                return;
            }

            const userData = await AsyncStorage.getItem("@chardhogo_user");
            if (!userData) {
                Alert.alert("Session Expired", "Please login again");
                router.replace("/login" as any);
                return;
            }

            const parsedUser = JSON.parse(userData);
            setUser({
                name: parsedUser.name || "Unknown User",
                email: parsedUser.email || "No email",
                phone: parsedUser.phone,
            });

            // Fetch stats from API
            try {
                const response = await statsAPI.getUserStats();
                if (response.success) {
                    setStats(response.stats);
                } else {
                    setStats(null);
                }
            } catch (error) {
                console.log("Stats not available:", error);
                setStats(null);
            }
        } catch (error) {
            console.error("Error loading user data:", error);
            Alert.alert("Error", "Failed to load profile data");
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadUserData();
        setRefreshing(false);
    };

    const handleLogout = async () => {
        console.log('🔘 Logout button direct press (User Profile)');
        try {
            console.log('🏃 Starting logout process...');
            await logout();
            console.log('✅ Local logout done, redirecting...');
            router.replace("/login" as any);
        } catch (err) {
            console.error('Logout error caught in UI:', err);
            router.replace("/login" as any);
        }
    };

    const handleEditProfile = () => {
        if (!user) return;

        Alert.alert(
            "Edit Profile",
            "Choose what to update",
            [
                {
                    text: "Update Name",
                    onPress: () => {
                        setEditType('name');
                        setEditValue(user.name);
                        setShowEditModal(true);
                    },
                },
                {
                    text: "Update Phone",
                    onPress: () => {
                        setEditType('phone');
                        setEditValue(user.phone || '');
                        setShowEditModal(true);
                    },
                },
                { text: "Cancel", style: "cancel" },
            ]
        );
    };

    const handleSaveEdit = async () => {
        if (!editValue || !editValue.trim()) {
            Alert.alert("Error", `Please enter a valid ${editType}`);
            return;
        }

        try {
            // Prepare update data
            const updateData: { name?: string; phone?: string } = {};
            if (editType === 'name') {
                updateData.name = editValue.trim();
            } else if (editType === 'phone') {
                updateData.phone = editValue.trim();
            }

            const response = await userAPI.updateProfile(updateData);

            if (response.success) {
                // Update AsyncStorage
                const userData = await AsyncStorage.getItem("@chardhogo_user");
                if (userData) {
                    const parsedUser = JSON.parse(userData);
                    if (editType === 'name') {
                        parsedUser.name = editValue.trim();
                    } else if (editType === 'phone') {
                        parsedUser.phone = editValue.trim();
                    }
                    await AsyncStorage.setItem("@chardhogo_user", JSON.stringify(parsedUser));
                }

                // Update local state
                setUser({ ...user!, ...updateData });

                setShowEditModal(false);
                Alert.alert("Success", `${editType === 'name' ? 'Name' : 'Phone number'} updated successfully!`);
            } else {
                Alert.alert("Error", response.message || `Failed to update ${editType}`);
            }
        } catch (error: any) {
            console.error('Update profile error:', error);
            Alert.alert("Error", error.message || `Failed to update ${editType}`);
        }
    };

    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        card: { backgroundColor: colors.card, borderColor: colors.border },
    };

    if (loading) {
        return <LoadingSpinner text="Loading profile..." />;
    }

    if (!user) {
        return <LoadingSpinner text="Loading profile..." />;
    }

    return (
        <ScrollView
            style={[styles.container, dynamicStyles.container]}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4FD1C5"]} tintColor={colors.text} />
            }
        >
            {/* Header */}
            <LinearGradient
                colors={['#0F2027', '#203A43', '#2C5364']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.title}>My Account</Text>
                    <Text style={styles.headerSubtitle}>Manage your profile and preferences</Text>
                </View>
            </LinearGradient>

            {/* Profile Card */}
            <ProfileCard user={user} stats={stats} onEditProfile={handleEditProfile} />

            {/* Stats Grid */}
            <ProfileStats stats={stats} />

            {/* Quick Actions */}
            <QuickActions />

            {/* Account Menu */}
            <MenuSection title="General">
                <MenuItem
                    iconFamily="MaterialIcons"
                    iconName="settings"
                    iconColor="#4FD1C5"
                    title="App Settings"
                    onPress={() => router.push("/account/settings" as any)}
                />
                <MenuItem
                    iconFamily="Ionicons"
                    iconName="notifications"
                    iconColor="#4FD1C5"
                    title="Notifications"
                    onPress={() => router.push("/account/notifications" as any)}
                    showBorder={false}
                />
            </MenuSection>

            {/* Help & Safety */}
            <MenuSection title="Help & Safety">
                <MenuItem
                    iconFamily="MaterialIcons"
                    iconName="warning"
                    iconColor="#f44336"
                    title="Emergency SOS"
                    onPress={() => router.push("/account/sos" as any)}
                />
                <MenuItem
                    iconFamily="MaterialIcons"
                    iconName="support-agent"
                    iconColor="#4FD1C5"
                    title="Customer Support"
                    onPress={() => router.push("/account/support" as any)}
                />
                <MenuItem
                    iconFamily="Ionicons"
                    iconName="shield-checkmark"
                    iconColor="#4FD1C5"
                    title="Privacy & Safety"
                    showBorder={false}
                />
            </MenuSection>

            {/* Logout Button */}
            <TouchableOpacity style={[styles.logoutBtn, dynamicStyles.card, { borderColor: '#f44336' }]} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#f44336" />
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>CharDhoGo v1.0.0</Text>
                <Text style={styles.footerCopyright}>© 2024 CharDhoGo. All rights reserved.</Text>
            </View>

            {/* Edit Modal */}
            <EditProfileModal
                visible={showEditModal}
                onClose={() => setShowEditModal(false)}
                onSave={handleSaveEdit}
                editType={editType}
                editValue={editValue}
                setEditValue={setEditValue}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7f7f6",
    },
    header: {
        paddingTop: 60,
        paddingBottom: 80,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: -40,
        zIndex: 1,
    },
    headerContent: {
        marginBottom: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: "900",
        color: "#ffffff",
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
    },
    logoutBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        margin: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#f44336",
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: "700",
        color: "#f44336",
    },
    footer: {
        alignItems: "center",
        paddingVertical: 24,
    },
    footerText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#667eea",
        marginBottom: 4,
    },
    footerCopyright: {
        fontSize: 12,
        color: "#999",
    },
});