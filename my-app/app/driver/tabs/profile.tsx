import React, { useState, useEffect, useCallback } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    RefreshControl,
    Alert,
    StatusBar,
    Dimensions,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "../../../context/AuthContext";
import { statsAPI } from "../../../services/statsAPI";
import driverAPI, { DriverProfile as IDriverProfile } from "../../../services/driverAPI";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import { useSettings } from "../../../context/SettingsContext";

const { width } = Dimensions.get('window');

interface DriverStats {
    totalRides: number;
    completedRides: number;
    totalEarnings: number;
    avgRating: number;
    todayRides?: number;
    todayEarnings?: number;
}

export default function DriverProfile() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<DriverStats | null>(null);
    const { logout } = useAuth();
    const [driver, setDriver] = useState<IDriverProfile | null>(null);
    const { colors, darkMode } = useSettings();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchProfile(),
                fetchStats()
            ]);
        } catch (error) {
            console.error("Error loading profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProfile = async () => {
        try {
            const response = await driverAPI.getProfile();
            if (response.success && response.driver) {
                setDriver(response.driver);
            }
        } catch (error) {
            console.log("Profile fetch error", error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await statsAPI.getDriverStats();
            if (response.success) {
                setStats(response.stats);
            }
        } catch (error: any) {
            console.error('Stats fetch error:', error.message);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchProfile(), fetchStats()]);
        setRefreshing(false);
    }, []);

    const handleLogout = () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Logout",
                style: "destructive",
                onPress: async () => {
                    try {
                        await logout();
                        // Redirect to root/login
                        router.replace("/login" as any);
                    } catch (err) {
                        console.error("Logout failed:", err);
                        // Fallback redirect
                        router.replace("/login" as any);
                    }
                },
            },
        ]);
    };

    if (loading) {
        return <LoadingSpinner text="Loading profile..." />;
    }

    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        card: { backgroundColor: colors.card, shadowColor: darkMode ? '#000' : '#ccc' },
        text: { color: colors.text },
        subText: { color: colors.subText },
    };

    const getRatingColor = (rating: number): [string, string] => {
        if (rating >= 4.5) return ['#4CAF50', '#45a049'];
        if (rating >= 4.0) return ['#FF9800', '#F57C00'];
        return ['#F44336', '#D32F2F'];
    };

    const getTierInfo = (rating: number) => {
        if (rating >= 4.5) return { tier: 'GOLD', emoji: '👑', color: '#FFD700' };
        if (rating >= 4.0) return { tier: 'SILVER', emoji: '🥈', color: '#C0C0C0' };
        return { tier: 'BRONZE', emoji: '🥉', color: '#CD7F32' };
    };

    const tierInfo = getTierInfo(stats?.avgRating ?? 0);

    return (
        <ScrollView
            style={[styles.container, dynamicStyles.container]}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4FD1C5"]} />
            }
        >
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

            {/* Modern Header with Gradient */}
            <LinearGradient
                colors={['#0F2027', '#203A43', '#2C5364']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerTop}>
                        <View>
                            <Text style={styles.greeting}>Welcome back,</Text>
                            <Text style={styles.driverName}>{driver?.name || 'Driver'}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => router.push("/driver/notifications" as any)}
                            >
                                <Ionicons name="notifications-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => router.push("/driver/edit-profile" as any)}
                            >
                                <Ionicons name="create-outline" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Contact Info */}
                    <View style={styles.contactInfo}>
                        <View style={styles.contactItem}>
                            <Ionicons name="mail-outline" size={14} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.contactText}>{driver?.email}</Text>
                        </View>
                        <View style={styles.contactItem}>
                            <Ionicons name="call-outline" size={14} color="rgba(255,255,255,0.8)" />
                            <Text style={styles.contactText}>{driver?.phone}</Text>
                        </View>
                    </View>

                    {/* Verification Badge */}
                    <View style={styles.verificationBadge}>
                        <Ionicons
                            name={driver?.isVerified ? "checkmark-circle" : "time-outline"}
                            size={16}
                            color={driver?.isVerified ? "#4CAF50" : "#FF9800"}
                        />
                        <Text style={[styles.verificationText, { color: driver?.isVerified ? "#4CAF50" : "#FF9800" }]}>
                            {driver?.isVerified ? "Verified Driver" : "Verification Pending"}
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Stats Overview Cards */}
            <View style={styles.statsOverview}>
                {/* Today's Performance */}
                <View style={[styles.todayCard, dynamicStyles.card]}>
                    <LinearGradient
                        colors={['#4FD1C5', '#38B2AC']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.todayGradient}
                    >
                        <View style={styles.todayHeader}>
                            <Ionicons name="today" size={24} color="#fff" />
                            <Text style={styles.todayTitle}>Today's Performance</Text>
                        </View>
                        <View style={styles.todayStats}>
                            <View style={styles.todayStat}>
                                <Text style={styles.todayStatValue}>{stats?.todayRides ?? 0}</Text>
                                <Text style={styles.todayStatLabel}>Rides</Text>
                            </View>
                            <View style={styles.todayStatDivider} />
                            <View style={styles.todayStat}>
                                <Text style={styles.todayStatValue}>₹{stats?.todayEarnings ?? 0}</Text>
                                <Text style={styles.todayStatLabel}>Earned</Text>
                            </View>
                        </View>
                    </LinearGradient>
                </View>

                {/* Quick Stats Grid */}
                <View style={styles.quickStatsGrid}>
                    <View style={[styles.quickStatCard, dynamicStyles.card]}>
                        <View style={[styles.quickStatIcon, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                            <MaterialCommunityIcons name="car-multiple" size={24} color="#4CAF50" />
                        </View>
                        <Text style={[styles.quickStatValue, dynamicStyles.text]}>{stats?.totalRides ?? 0}</Text>
                        <Text style={[styles.quickStatLabel, dynamicStyles.subText]}>Total Rides</Text>
                        <Text style={[styles.quickStatSubtext, dynamicStyles.subText]}>
                            {stats?.completedRides ?? 0} completed
                        </Text>
                    </View>

                    <View style={[styles.quickStatCard, dynamicStyles.card]}>
                        <View style={[styles.quickStatIcon, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                            <Ionicons name="cash" size={24} color="#4CAF50" />
                        </View>
                        <Text style={[styles.quickStatValue, dynamicStyles.text]}>₹{stats?.totalEarnings ?? 0}</Text>
                        <Text style={[styles.quickStatLabel, dynamicStyles.subText]}>Total Earned</Text>
                        <Text style={[styles.quickStatSubtext, dynamicStyles.subText]}>Lifetime</Text>
                    </View>
                </View>
            </View>

            {/* Premium Rating Card */}
            {stats && (
                <View style={styles.ratingSection}>
                    <Text style={[styles.sectionTitle, dynamicStyles.text]}>Your Rating</Text>
                    <View style={[styles.premiumRatingCard, dynamicStyles.card]}>
                        <LinearGradient
                            colors={getRatingColor(stats.avgRating ?? 0)}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.ratingGradient}
                        >
                            {/* Header */}
                            <View style={styles.ratingHeader}>
                                <View style={styles.ratingTitleRow}>
                                    <Ionicons name="trophy" size={24} color="#FFD700" />
                                    <Text style={styles.ratingTitle}>Driver Rating</Text>
                                </View>
                                <View style={[styles.tierBadge, { borderColor: tierInfo.color }]}>
                                    <Text style={[styles.tierBadgeText, { color: tierInfo.color }]}>
                                        {tierInfo.emoji} {tierInfo.tier}
                                    </Text>
                                </View>
                            </View>

                            {/* Main Content */}
                            <View style={styles.ratingMainContent}>
                                {/* Circular Rating */}
                                <View style={styles.circularRatingContainer}>
                                    <View style={styles.circularRating}>
                                        <Text style={styles.circularRatingValue}>
                                            {(stats.avgRating ?? 0).toFixed(1)}
                                        </Text>
                                        <View style={styles.circularStars}>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Ionicons
                                                    key={star}
                                                    name={star <= Math.round(stats.avgRating ?? 0) ? "star" : "star-outline"}
                                                    size={16}
                                                    color="#FFD700"
                                                />
                                            ))}
                                        </View>
                                        <Text style={styles.circularRatingLabel}>out of 5.0</Text>
                                    </View>
                                </View>

                                {/* Stats Breakdown */}
                                <View style={styles.ratingStatsColumn}>
                                    <View style={styles.ratingStatRow}>
                                        <View style={styles.ratingStatIcon}>
                                            <Ionicons name="people" size={18} color="#fff" />
                                        </View>
                                        <View style={styles.ratingStatContent}>
                                            <Text style={styles.ratingStatValue}>{stats.totalRides}</Text>
                                            <Text style={styles.ratingStatLabel}>Total Rides</Text>
                                        </View>
                                    </View>
                                    <View style={styles.ratingStatRow}>
                                        <View style={styles.ratingStatIcon}>
                                            <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                        </View>
                                        <View style={styles.ratingStatContent}>
                                            <Text style={styles.ratingStatValue}>{stats.completedRides}</Text>
                                            <Text style={styles.ratingStatLabel}>Completed</Text>
                                        </View>
                                    </View>
                                    <View style={styles.ratingStatRow}>
                                        <View style={styles.ratingStatIcon}>
                                            <Ionicons name="trending-up" size={18} color="#fff" />
                                        </View>
                                        <View style={styles.ratingStatContent}>
                                            <Text style={styles.ratingStatValue}>
                                                {stats.totalRides > 0 ? Math.round((stats.completedRides / stats.totalRides) * 100) : 0}%
                                            </Text>
                                            <Text style={styles.ratingStatLabel}>Success</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Performance Message */}
                            <View style={styles.performanceMessage}>
                                <Ionicons
                                    name={(stats.avgRating ?? 0) >= 4.5 ? "sparkles" : (stats.avgRating ?? 0) >= 4.0 ? "thumbs-up" : "trending-up"}
                                    size={16}
                                    color="#FFD700"
                                />
                                <Text style={styles.performanceText}>
                                    {(stats.avgRating ?? 0) >= 4.5
                                        ? 'Outstanding! You\'re in the top tier!'
                                        : (stats.avgRating ?? 0) >= 4.0
                                            ? 'Great work! Keep it up!'
                                            : 'Keep improving to unlock rewards!'}
                                </Text>
                            </View>
                        </LinearGradient>
                    </View>
                </View>
            )}

            {/* Vehicle Info */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, dynamicStyles.text]}>Vehicle Information</Text>
                {driver?.vehicle ? (
                    <View style={[styles.vehicleCard, dynamicStyles.card]}>
                        <View style={styles.vehicleIcon}>
                            <MaterialCommunityIcons name="car" size={32} color="#4FD1C5" />
                        </View>
                        <View style={styles.vehicleInfo}>
                            <Text style={[styles.vehicleType, dynamicStyles.text]}>{driver.vehicle.type.toUpperCase()}</Text>
                            <Text style={[styles.vehicleModel, dynamicStyles.subText]}>{driver.vehicle.model} • {driver.vehicle.color}</Text>
                            <Text style={styles.vehicleNumber}>{driver.vehicle.plateNumber}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.editVehicleBtn}
                            onPress={() => router.push("/driver/edit-vehicle" as any)}
                        >
                            <Ionicons name="create-outline" size={20} color="#4FD1C5" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.addVehicleBtn, dynamicStyles.card, { borderColor: colors.primary }]}
                        onPress={() => router.push("/driver/edit-vehicle" as any)}
                    >
                        <Ionicons name="add-circle-outline" size={24} color="#4FD1C5" />
                        <Text style={styles.addVehicleText}>Add Vehicle Details</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Quick Actions Menu */}
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, dynamicStyles.text]}>Quick Actions</Text>
                <View style={[styles.menuSection, dynamicStyles.card]}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push("/driver/bank-details" as any)}
                    >
                        <View style={styles.menuIconContainer}>
                            <MaterialCommunityIcons name="bank" size={24} color="#4FD1C5" />
                        </View>
                        <View style={styles.menuContent}>
                            <Text style={[styles.menuText, dynamicStyles.text]}>Bank Details</Text>
                            <Text style={[styles.menuSubtext, dynamicStyles.subText]}>Manage payout methods</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.subText} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push("/driver/documents" as any)}
                    >
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="document-text" size={24} color="#4FD1C5" />
                        </View>
                        <View style={styles.menuContent}>
                            <Text style={[styles.menuText, dynamicStyles.text]}>Documents</Text>
                            <Text style={[styles.menuSubtext, dynamicStyles.subText]}>Upload verification docs</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.subText} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => router.push("/driver/settings" as any)}
                    >
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="settings" size={24} color="#4FD1C5" />
                        </View>
                        <View style={styles.menuContent}>
                            <Text style={[styles.menuText, dynamicStyles.text]}>Settings</Text>
                            <Text style={[styles.menuSubtext, dynamicStyles.subText]}>App preferences</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.subText} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, { borderBottomWidth: 0 }]}
                        onPress={() => router.push("/driver/help" as any)}
                    >
                        <View style={styles.menuIconContainer}>
                            <Ionicons name="help-circle" size={24} color="#4FD1C5" />
                        </View>
                        <View style={styles.menuContent}>
                            <Text style={[styles.menuText, dynamicStyles.text]}>Help & Support</Text>
                            <Text style={[styles.menuSubtext, dynamicStyles.subText]}>Get assistance</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.subText} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={[styles.logoutBtn, dynamicStyles.card]} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color="#f44336" />
                <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>CharDhoGo Driver v1.0.0</Text>
                <Text style={styles.footerCopyright}>© 2024 CharDhoGo. All rights reserved.</Text>
            </View>
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
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        gap: 12,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    greeting: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '500',
        marginBottom: 4,
    },
    driverName: {
        fontSize: 28,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: -0.5,
    },
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactInfo: {
        gap: 6,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    contactText: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
        fontWeight: '500',
    },
    verificationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 4,
    },
    verificationText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statsOverview: {
        padding: 16,
        gap: 12,
        marginTop: -20,
    },
    todayCard: {
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: '#4FD1C5',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    todayGradient: {
        padding: 20,
    },
    todayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    todayTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
    todayStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    todayStat: {
        flex: 1,
        alignItems: 'center',
    },
    todayStatValue: {
        fontSize: 32,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 4,
    },
    todayStatLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.9)',
    },
    todayStatDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    quickStatsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    quickStatCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    quickStatIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    quickStatValue: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 4,
    },
    quickStatLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    quickStatSubtext: {
        fontSize: 11,
        fontWeight: '500',
    },
    ratingSection: {
        padding: 16,
        paddingTop: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 12,
    },
    premiumRatingCard: {
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
    },
    ratingGradient: {
        padding: 24,
    },
    ratingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    ratingTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    ratingTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
    },
    tierBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1.5,
    },
    tierBadgeText: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    ratingMainContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    circularRatingContainer: {
        marginRight: 20,
    },
    circularRating: {
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    circularRatingValue: {
        fontSize: 42,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 6,
    },
    circularStars: {
        flexDirection: 'row',
        gap: 2,
        marginBottom: 4,
    },
    circularRatingLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.8)',
    },
    ratingStatsColumn: {
        flex: 1,
        gap: 10,
    },
    ratingStatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 10,
        borderRadius: 12,
        gap: 10,
    },
    ratingStatIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ratingStatContent: {
        flex: 1,
    },
    ratingStatValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
        marginBottom: 2,
    },
    ratingStatLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.7)',
        textTransform: 'uppercase',
    },
    performanceMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        padding: 12,
        borderRadius: 12,
        gap: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#FFD700',
    },
    performanceText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    section: {
        padding: 16,
        paddingTop: 0,
    },
    vehicleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    vehicleIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(79, 209, 197, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleType: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    vehicleModel: {
        fontSize: 15,
        marginBottom: 4,
    },
    vehicleNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#667eea',
    },
    editVehicleBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(79, 209, 197, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addVehicleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderRadius: 16,
        gap: 8,
        borderWidth: 2,
        borderStyle: 'dashed',
    },
    addVehicleText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#4FD1C5',
    },
    menuSection: {
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    menuIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(79, 209, 197, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuContent: {
        flex: 1,
    },
    menuText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    menuSubtext: {
        fontSize: 12,
        fontWeight: '500',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 16,
        padding: 14,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#f44336',
        gap: 8,
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#f44336',
    },
    footer: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    footerText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#667eea',
        marginBottom: 4,
    },
    footerCopyright: {
        fontSize: 12,
        color: '#999',
    },
});
