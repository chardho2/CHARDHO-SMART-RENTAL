import React, { useState, useEffect, useCallback } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    Image,
    StatusBar,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { bookingAPI } from "../../../services/bookingAPI";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import EmptyState from "../../../components/common/EmptyState";
import RatingStars from "../../../components/common/RatingStars";
import { useAuth } from "../../../context/AuthContext";
import { router } from "expo-router";
import { useSettings } from "../../../context/SettingsContext";

interface Trip {
    _id: string;
    pickup: {
        name: string;
        address: string;
    };
    destination: {
        name: string;
        address: string;
    };
    fare: {
        total: number;
    };
    status: string;
    createdAt: string;
    user: {
        name: string;
        phone: string;
        profileImage?: string;
    };
    rating?: {
        driverRating?: number;
    };
}

export default function DriverTrips() {
    const { user } = useAuth();
    const { colors, darkMode } = useSettings();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<string>("all");
    const [trips, setTrips] = useState<Trip[]>([]);
    const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);

    const filters = [
        { id: "all", label: "All", icon: "list" as const },
        { id: "completed", label: "Completed", icon: "checkmark-circle" as const },
        { id: "cancelled", label: "Cancelled", icon: "close-circle" as const },
    ];

    useEffect(() => {
        if (user) {
            fetchTrips();
        }
    }, [user]);

    useEffect(() => {
        filterTrips();
    }, [trips, searchQuery, activeFilter]);

    const fetchTrips = async () => {
        try {
            setLoading(true);
            const response = await bookingAPI.getDriverBookings();
            if (response.success) {
                setTrips(response.bookings || []);
            }
        } catch (error) {
            console.error("Error fetching trips:", error);
            setTrips([]);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchTrips();
        setRefreshing(false);
    }, []);

    const filterTrips = () => {
        let filtered = trips;

        if (activeFilter !== "all") {
            filtered = filtered.filter((trip) => trip.status === activeFilter);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (trip) =>
                    trip.pickup.name.toLowerCase().includes(query) ||
                    trip.destination.name.toLowerCase().includes(query) ||
                    trip.user?.name?.toLowerCase().includes(query)
            );
        }

        setFilteredTrips(filtered);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "#4caf50";
            case "cancelled": return "#f44336";
            case "accepted": return "#2196f3";
            case "started": return "#ff9800";
            default: return "#999";
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        contentContainer: { backgroundColor: colors.background },
        card: { backgroundColor: colors.card, shadowColor: darkMode ? '#000' : '#ccc' },
        text: { color: colors.text },
        subText: { color: colors.subText },
        input: { backgroundColor: darkMode ? colors.input : '#f5f5f5', color: colors.text },
        border: { borderColor: colors.border },
        sectionBg: { backgroundColor: darkMode ? colors.card : '#fff' },
        routeBg: { backgroundColor: darkMode ? '#2C2C2C' : '#f9f9f9' },
    };

    const renderTripCard = (trip: Trip) => (
        <TouchableOpacity
            key={trip._id}
            style={[styles.tripCard, dynamicStyles.card]}
            onPress={() => {
                // Navigate to trip details if needed
            }}
            activeOpacity={0.9}
        >
            {/* Header */}
            <View style={styles.tripHeader}>
                <View style={styles.customerInfo}>
                    <View style={styles.customerAvatar}>
                        {trip.user?.profileImage ? (
                            <Image
                                source={{ uri: trip.user.profileImage }}
                                style={styles.avatarImage}
                            />
                        ) : (
                            <Text style={styles.avatarText}>
                                {trip.user?.name?.charAt(0) || 'U'}
                            </Text>
                        )}
                    </View>
                    <View style={styles.customerDetails}>
                        <Text style={[styles.customerName, dynamicStyles.text]}>{trip.user?.name || 'Customer'}</Text>
                        <Text style={[styles.tripDate, dynamicStyles.subText]}>{formatDate(trip.createdAt)}</Text>
                    </View>
                </View>
                <View style={styles.fareContainer}>
                    <Text style={[styles.fareAmount, dynamicStyles.text]}>₹{trip.fare?.total || 0}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(trip.status)}15` }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(trip.status) }]}>
                            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Route */}
            <View style={[styles.tripRoute, dynamicStyles.routeBg]}>
                <View style={styles.routeDecor}>
                    <View style={[styles.dot, { backgroundColor: '#4FD1C5' }]} />
                    <View style={styles.line} />
                    <View style={[styles.dot, { backgroundColor: '#f44336' }]} />
                </View>
                <View style={styles.routeText}>
                    <View style={styles.locationContainer}>
                        <Text style={styles.locationLabel}>PICKUP</Text>
                        <Text style={[styles.locationName, dynamicStyles.text]} numberOfLines={1}>
                            {trip.pickup.name}
                        </Text>
                    </View>
                    <View style={[styles.locationContainer, { marginTop: 16 }]}>
                        <Text style={styles.locationLabel}>DROP</Text>
                        <Text style={[styles.locationName, dynamicStyles.text]} numberOfLines={1}>
                            {trip.destination.name}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Rating if available */}
            {trip.rating?.driverRating && (
                <View style={styles.ratingSection}>
                    <View style={[styles.ratingDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.ratingContent}>
                        <Text style={[styles.ratingLabel, dynamicStyles.subText]}>Customer Rating:</Text>
                        <RatingStars rating={trip.rating.driverRating} size={16} />
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );

    if (!user) {
        return (
            <View style={[styles.container, dynamicStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="lock-closed-outline" size={64} color={colors.subText} />
                <Text style={{ marginTop: 16, fontSize: 18, color: colors.subText }}>Please login to view trips</Text>
                <TouchableOpacity
                    style={{
                        marginTop: 20,
                        backgroundColor: '#2C5364',
                        paddingHorizontal: 24,
                        paddingVertical: 12,
                        borderRadius: 8
                    }}
                    onPress={() => router.push('/login/driver' as any)}
                >
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}>Login as Driver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (loading) {
        return <LoadingSpinner text="Loading your trips..." />;
    }

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
            <LinearGradient
                colors={['#0F2027', '#203A43', '#2C5364']}
                style={styles.headerBackground}
            >
                <Text style={styles.title}>My Trips</Text>
                <Text style={styles.subtitle}>Your ride history</Text>
            </LinearGradient>

            <View style={[styles.contentContainer, dynamicStyles.contentContainer]}>
                {/* Search & Filter Section */}
                <View style={[styles.controlsSection, dynamicStyles.sectionBg, { borderBottomColor: colors.border }]}>
                    <View style={[styles.searchContainer, dynamicStyles.input]}>
                        <Ionicons name="search" size={20} color={colors.subText} />
                        <TextInput
                            placeholder="Search location or customer"
                            style={[styles.searchInput, { color: colors.text }]}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor={colors.subText}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery("")}>
                                <Ionicons name="close-circle" size={20} color={colors.subText} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.filtersContent}
                    >
                        {filters.map((filter) => (
                            <TouchableOpacity
                                key={filter.id}
                                style={[
                                    styles.filterChip,
                                    dynamicStyles.sectionBg,
                                    { borderColor: colors.border },
                                    activeFilter === filter.id && styles.filterChipActive,
                                ]}
                                onPress={() => setActiveFilter(filter.id)}
                            >
                                <Ionicons
                                    name={filter.icon}
                                    size={16}
                                    color={activeFilter === filter.id ? "#fff" : colors.subText}
                                />
                                <Text
                                    style={[
                                        styles.filterText,
                                        { color: colors.subText },
                                        activeFilter === filter.id && styles.filterTextActive,
                                    ]}
                                >
                                    {filter.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Trips List */}
                <ScrollView
                    style={styles.tripsList}
                    contentContainerStyle={styles.tripsListContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={["#4FD1C5"]}
                            tintColor="#4FD1C5"
                        />
                    }
                >
                    {filteredTrips.length === 0 ? (
                        <EmptyState
                            icon="car-sport-outline"
                            title="No Trips Found"
                            message={
                                searchQuery
                                    ? "No trips match your search"
                                    : activeFilter === "all"
                                        ? "You haven't completed any trips yet"
                                        : `No ${activeFilter} trips found`
                            }
                        />
                    ) : (
                        filteredTrips.map(renderTripCard)
                    )}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7f7f6",
    },
    headerBackground: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: "900",
        color: "#ffffff",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.8)",
        fontWeight: '500',
    },
    contentContainer: {
        flex: 1,
        backgroundColor: '#f7f7f6',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: -20,
        overflow: 'hidden',
    },
    controlsSection: {
        backgroundColor: '#fff',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f5f5f5",
        marginHorizontal: 16,
        marginBottom: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        height: 48,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 15,
        color: "#1a1a1a",
    },
    filtersContent: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterChip: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: "#e0e0e0",
    },
    filterChipActive: {
        backgroundColor: "#2C5364",
        borderColor: "#2C5364",
    },
    filterText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#666",
    },
    filterTextActive: {
        color: "#fff",
    },
    tripsList: {
        flex: 1,
    },
    tripsListContent: {
        padding: 16,
        paddingBottom: 32,
    },
    tripCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
    },
    tripHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    customerInfo: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    customerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#E0F2F1",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#4FD1C5",
    },
    customerDetails: {
        flex: 1,
    },
    customerName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1a1a1a",
        marginBottom: 2,
    },
    tripDate: {
        fontSize: 12,
        color: "#999",
    },
    fareContainer: {
        alignItems: "flex-end",
    },
    fareAmount: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1a1a1a",
        marginBottom: 4,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "700",
    },
    tripRoute: {
        flexDirection: "row",
        backgroundColor: "#f9f9f9",
        padding: 12,
        borderRadius: 12,
    },
    routeDecor: {
        width: 16,
        alignItems: "center",
        marginRight: 12,
        paddingVertical: 4,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    line: {
        width: 2,
        flex: 1,
        backgroundColor: "#ddd",
        marginVertical: 4,
    },
    routeText: {
        flex: 1,
        justifyContent: 'space-between',
    },
    locationContainer: {
        flex: 1,
    },
    locationLabel: {
        fontSize: 10,
        color: "#999",
        fontWeight: "700",
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    locationName: {
        fontSize: 14,
        fontWeight: "600",
        color: "#333",
    },
    ratingSection: {
        marginTop: 12,
    },
    ratingDivider: {
        height: 1,
        backgroundColor: "#f0f0f0",
        marginBottom: 12,
    },
    ratingContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    ratingLabel: {
        fontSize: 13,
        color: "#666",
        fontWeight: "600",
    },
});
