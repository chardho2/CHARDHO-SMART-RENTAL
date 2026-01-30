import React, { useState, useEffect, useCallback } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    TextInput,
    RefreshControl,
    ActivityIndicator,
    FlatList,
    Modal,
    Alert
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { bookingAPI } from "../../services/bookingAPI";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import RatingStars from "../../components/common/RatingStars";
import { useAuth } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";

interface Trip {
    _id: string;
    pickup: {
        name: string;
        address: string;
        coordinates: { latitude: number; longitude: number };
    };
    destination: {
        name: string;
        address: string;
        coordinates: { latitude: number; longitude: number };
    };
    rideType: string;
    fare: {
        baseFare: number;
        distanceCharge: number;
        total: number;
        distance: number;
        minFareAdjustment?: number;
    };
    status: string;
    createdAt: string;
    driver?: {
        name: string;
        phone: string;
        rating?: number;
        vehicle?: {
            model?: string;
            plateNumber?: string;
        };
    };
    rating?: number; // Backend saves it as a number
}

export default function MyTrips() {
    const { user } = useAuth();
    const { colors, darkMode } = useSettings();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [filteredTrips, setFilteredTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<string>("all");

    // Modal States
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [showReceipt, setShowReceipt] = useState(false);
    const [showRating, setShowRating] = useState(false);
    const [ratingValue, setRatingValue] = useState(5);
    const [ratingComment, setRatingComment] = useState("");
    const [ratingSubmitting, setRatingSubmitting] = useState(false);

    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        card: { backgroundColor: colors.card, borderColor: colors.border },
        text: { color: colors.text },
        subText: { color: colors.subText },
        border: { borderColor: colors.border },
        input: { color: colors.text, backgroundColor: colors.card },
        icon: { color: colors.subText },
        modalContent: { backgroundColor: colors.card },
    };

    const filters = [
        { id: "all", label: "All", icon: "list" as const },
        { id: "completed", label: "Completed", icon: "checkmark-circle" as const },
        { id: "cancelled", label: "Cancelled", icon: "close-circle" as const },
        { id: "pending", label: "Pending", icon: "time" as const },
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
            const response = await bookingAPI.getMyBookings();
            if (response.success) {
                setTrips(response.bookings || []);
            }
        } catch (error: any) {
            console.log("Error fetching trips:", error);
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
                    trip.driver?.name.toLowerCase().includes(query)
            );
        }
        setFilteredTrips(filtered);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "#4caf50";
            case "cancelled": return "#f44336";
            case "pending": return "#ff9800";
            case "in-progress": return "#2196f3";
            default: return "#999";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed": return "checkmark-circle";
            case "cancelled": return "close-circle";
            case "pending": return "time";
            case "in-progress": return "car";
            default: return "ellipse";
        }
    };

    // Corrected formatDate function
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tripDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        // Calculate difference in milliseconds
        const diffTime = today.getTime() - tripDate.getTime();
        // Convert to days
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7 && diffDays > 0) return `${diffDays} days ago`;

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const handleRebook = (trip: Trip) => {
        // Navigate to Booking Page with Pre-filled Data
        router.push({
            pathname: "/booking",
            params: {
                pickupName: trip.pickup.name,
                pickupAddress: trip.pickup.address,
                pickupLat: trip.pickup.coordinates.latitude,
                pickupLng: trip.pickup.coordinates.longitude,
                dropName: trip.destination.name,
                dropAddress: trip.destination.address,
                dropLat: trip.destination.coordinates.latitude,
                dropLng: trip.destination.coordinates.longitude,
            }
        } as any);
    };

    const submitRating = async () => {
        if (!selectedTrip) return;
        try {
            setRatingSubmitting(true);
            await bookingAPI.rateDriver(selectedTrip._id, ratingValue, ratingComment);
            Alert.alert("Success", "Thank you for your feedback!");
            setShowRating(false);
            fetchTrips(); // Refresh to show updated rating
        } catch (error) {
            console.error("Rating error:", error);
            Alert.alert("Error", "Failed to submit rating");
        } finally {
            setRatingSubmitting(false);
        }
    };

    const renderTripCard = ({ item: trip }: { item: Trip }) => (
        <View style={[styles.tripCard, dynamicStyles.card]}>
            {/* Header */}
            <View style={styles.tripHeader}>
                <View style={[styles.rideTypeIcon, { backgroundColor: `${getStatusColor(trip.status)}15` }]}>
                    <Ionicons name="car" size={24} color={getStatusColor(trip.status)} />
                </View>
                <View style={styles.tripHeaderInfo}>
                    <Text style={[styles.tripDate, dynamicStyles.text]}>{formatDate(trip.createdAt)}</Text>
                    <View style={styles.statusBadge}>
                        <Ionicons name={getStatusIcon(trip.status) as any} size={14} color={getStatusColor(trip.status)} />
                        <Text style={[styles.statusText, { color: getStatusColor(trip.status) }]}>
                            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                        </Text>
                    </View>
                </View>
                <Text style={styles.tripFare}>₹{trip.fare?.total || 0}</Text>
            </View>

            {/* Connection Line & Dots */}
            <View style={styles.tripRoute}>
                <View style={styles.routeIndicator}>
                    <View style={styles.pickupDot} />
                    <View style={styles.routeLine} />
                    <View style={styles.destinationDot} />
                </View>
                <View style={styles.routeDetails}>
                    <View style={styles.locationRow}>
                        <Text style={styles.locationLabel}>Pickup</Text>
                        <Text style={[styles.locationName, dynamicStyles.text]} numberOfLines={1}>{trip.pickup.name}</Text>
                    </View>
                    <View style={styles.locationRow}>
                        <Text style={styles.locationLabel}>Drop</Text>
                        <Text style={[styles.locationName, dynamicStyles.text]} numberOfLines={1}>{trip.destination.name}</Text>
                    </View>
                </View>
            </View>

            {/* Driver Info */}
            {trip.driver && (
                <View style={[styles.driverInfo, dynamicStyles.border]}>
                    <View style={styles.driverRow}>
                        <Ionicons name="person-circle" size={24} color={colors.subText} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={[styles.driverName, dynamicStyles.text]}>{trip.driver.name}</Text>
                            <Text style={[styles.plateNumber, dynamicStyles.subText]}>
                                {trip.driver.vehicle?.plateNumber || ''}
                            </Text>
                        </View>
                        {trip.status === 'completed' && trip.rating && (
                            <View style={styles.ratingDisplay}>
                                <Ionicons name="star" size={14} color="#FFB800" />
                                <Text style={[styles.ratingValue, { color: '#333' }]}>
                                    {trip.rating.toFixed(1)}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            )}

            {/* Actions Footer */}
            <View style={[styles.tripActions, dynamicStyles.border]}>
                {trip.status === "completed" && (
                    <TouchableOpacity
                        style={[styles.actionBtn, darkMode && { backgroundColor: 'rgba(255,255,255,0.05)' }]}
                        disabled={!!trip.rating}
                        onPress={() => {
                            setSelectedTrip(trip);
                            setRatingValue(5);
                            setRatingComment("");
                            setShowRating(true);
                        }}
                    >
                        <Ionicons
                            name={trip.rating ? "star" : "star-outline"}
                            size={16}
                            color={trip.rating ? "#FFB800" : (darkMode ? "#ccc" : "#666")}
                        />
                        <Text style={[styles.actionText, darkMode && { color: "#ccc" }, trip.rating ? { color: "#FFB800" } : {}]}>
                            {trip.rating ? `${trip.rating}` : "Rate"}
                        </Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={[styles.actionBtn, darkMode && { backgroundColor: 'rgba(255,255,255,0.05)' }]}
                    onPress={() => {
                        setSelectedTrip(trip);
                        setShowReceipt(true);
                    }}
                >
                    <Ionicons name="receipt-outline" size={16} color={darkMode ? "#ccc" : "#666"} />
                    <Text style={[styles.actionText, darkMode && { color: "#ccc" }]}>Receipt</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, darkMode && { backgroundColor: 'rgba(255,255,255,0.05)' }]}
                    onPress={() => handleRebook(trip)}
                >
                    <Ionicons name="refresh" size={16} color={darkMode ? "#ccc" : "#666"} />
                    <Text style={[styles.actionText, darkMode && { color: "#ccc" }]}>Rebook</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    if (!user) return null;
    if (loading && !refreshing && trips.length === 0) return <LoadingSpinner text="Loading trips..." />;

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <LinearGradient
                colors={['#0F2027', '#203A43', '#2C5364']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Text style={styles.title}>Trip History</Text>
                <Text style={styles.subtitle}>Review your past rides and details</Text>
            </LinearGradient>

            <View style={styles.contentContainer}>
                {/* Filters Row */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer} contentContainerStyle={styles.filtersContent}>
                    {filters.map((filter) => (
                        <TouchableOpacity
                            key={filter.id}
                            style={[
                                styles.filterChip,
                                dynamicStyles.card,
                                dynamicStyles.border,
                                activeFilter === filter.id && styles.filterChipActive,
                            ]}
                            onPress={() => setActiveFilter(filter.id)}
                        >
                            <Ionicons name={filter.icon} size={18} color={activeFilter === filter.id ? "#fff" : colors.subText} />
                            <Text style={[styles.filterText, dynamicStyles.subText, activeFilter === filter.id && styles.filterTextActive]}>
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <FlatList
                    data={filteredTrips}
                    renderItem={renderTripCard}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.tripsContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4FD1C5"]} tintColor={colors.text} />
                    }
                    ListEmptyComponent={<EmptyState icon="time-outline" title="No Trips Found" message="You haven't taken any rides yet." />}
                />
            </View>

            {/* Receipt Modal */}
            <Modal visible={showReceipt} transparent animationType="slide" onRequestClose={() => setShowReceipt(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, dynamicStyles.modalContent]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, dynamicStyles.text]}>Ride Receipt</Text>
                            <TouchableOpacity onPress={() => setShowReceipt(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        {selectedTrip && (
                            <ScrollView style={styles.receiptBody}>
                                <View style={styles.receiptRow}>
                                    <Text style={[styles.receiptLabel, dynamicStyles.subText]}>Date</Text>
                                    <Text style={[styles.receiptValue, dynamicStyles.text]}>{new Date(selectedTrip.createdAt).toLocaleString()}</Text>
                                </View>
                                <View style={styles.receiptDivider} />
                                <View style={styles.receiptRow}>
                                    <Text style={[styles.receiptLabel, dynamicStyles.subText]}>Base Fare</Text>
                                    <Text style={[styles.receiptValue, dynamicStyles.text]}>₹{selectedTrip.fare.baseFare}</Text>
                                </View>
                                <View style={styles.receiptRow}>
                                    <Text style={[styles.receiptLabel, dynamicStyles.subText]}>Distance Charge ({selectedTrip.fare.distance} km)</Text>
                                    <Text style={[styles.receiptValue, dynamicStyles.text]}>₹{selectedTrip.fare.distanceCharge}</Text>
                                </View>
                                {selectedTrip.fare.minFareAdjustment ? (
                                    <View style={styles.receiptRow}>
                                        <Text style={[styles.receiptLabel, dynamicStyles.subText]}>Min Fare Adj.</Text>
                                        <Text style={[styles.receiptValue, dynamicStyles.text]}>₹{selectedTrip.fare.minFareAdjustment}</Text>
                                    </View>
                                ) : null}
                                <View style={[styles.receiptDivider, { height: 2, backgroundColor: colors.border }]} />
                                <View style={styles.receiptRow}>
                                    <Text style={[styles.receiptTotalLabel, dynamicStyles.text]}>Total Paid</Text>
                                    <Text style={[styles.receiptTotalValue, { color: '#4FD1C5' }]}>₹{selectedTrip.fare.total}</Text>
                                </View>
                            </ScrollView>
                        )}
                        <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowReceipt(false)}>
                            <Text style={styles.closeModalText}>Close Receipt</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Rating Modal */}
            <Modal visible={showRating} transparent animationType="slide" onRequestClose={() => setShowRating(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, dynamicStyles.modalContent]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, dynamicStyles.text]}>Rate Driver</Text>
                            <TouchableOpacity onPress={() => setShowRating(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.ratingBody}>
                            <Text style={[styles.ratingPrompt, dynamicStyles.subText]}>How was your ride with {selectedTrip?.driver?.name}?</Text>
                            <View style={styles.starsContainer}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <TouchableOpacity key={star} onPress={() => setRatingValue(star)}>
                                        <Ionicons
                                            name={star <= ratingValue ? "star" : "star-outline"}
                                            size={40}
                                            color="#FFB800"
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <TextInput
                                style={[styles.commentInput, dynamicStyles.input, dynamicStyles.border]}
                                placeholder="Add a comment (optional)"
                                placeholderTextColor={colors.subText}
                                value={ratingComment}
                                onChangeText={setRatingComment}
                                multiline
                            />
                            <TouchableOpacity
                                style={styles.submitRatingBtn}
                                onPress={submitRating}
                                disabled={ratingSubmitting}
                            >
                                {ratingSubmitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.submitRatingText}>Submit Rating</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f7f7f6" },
    header: { padding: 20, paddingTop: 60, paddingBottom: 20 },
    title: { fontSize: 28, fontWeight: "800", color: "#fff" },
    subtitle: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
    contentContainer: { flex: 1 },
    filtersContainer: { marginTop: 16, marginBottom: 8 },
    filtersContent: { paddingHorizontal: 16, gap: 10 },
    filterChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#eee", marginRight: 8 },
    filterChipActive: { backgroundColor: "#4FD1C5", borderColor: "#4FD1C5" },
    filterText: { fontSize: 14, fontWeight: "600", color: "#666", marginLeft: 6 },
    filterTextActive: { color: "#fff" },
    tripsContent: { padding: 16, gap: 16, paddingBottom: 40 },
    tripCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, borderWidth: 1, borderColor: "#eee" },
    tripHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    rideTypeIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 12 },
    tripHeaderInfo: { flex: 1 },
    tripDate: { fontSize: 14, fontWeight: "600", marginBottom: 4 },
    statusBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
    statusText: { fontSize: 12, fontWeight: "600" },
    tripFare: { fontSize: 18, fontWeight: "800", color: "#667eea" },
    tripRoute: { flexDirection: "row", marginBottom: 16 },
    routeIndicator: { width: 20, alignItems: "center", marginRight: 12 },
    pickupDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4caf50", marginBottom: 2 },
    routeLine: { width: 2, flex: 1, backgroundColor: "#e0e0e0", marginVertical: 2 },
    destinationDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#f44336", marginTop: 2 },
    routeDetails: { flex: 1, gap: 12 },
    locationRow: {},
    locationLabel: { fontSize: 10, color: "#999", textTransform: "uppercase", fontWeight: "700", marginBottom: 2 },
    locationName: { fontSize: 14, fontWeight: "600" },
    driverInfo: { paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f5f5f5", marginBottom: 12 },
    driverRow: { flexDirection: 'row', alignItems: 'center' },
    driverName: { fontSize: 14, fontWeight: "600" },
    plateNumber: { fontSize: 12 },
    ratingDisplay: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9F0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, gap: 4 },
    ratingValue: { fontSize: 12, fontWeight: '700' },
    tripActions: { flexDirection: "row", gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f5f5f5" },
    actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: "#f8f9fa", paddingVertical: 8, borderRadius: 8, gap: 6 },
    actionText: { fontSize: 12, fontWeight: "600", color: "#666" },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 300 },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: "bold" },
    receiptBody: { marginBottom: 20 },
    receiptRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
    receiptLabel: { fontSize: 14, color: "#666" },
    receiptValue: { fontSize: 14, fontWeight: "600" },
    receiptDivider: { height: 1, backgroundColor: "#eee", marginVertical: 8 },
    receiptTotalLabel: { fontSize: 16, fontWeight: "bold" },
    receiptTotalValue: { fontSize: 18, fontWeight: "bold" },
    closeModalBtn: { backgroundColor: "#f0f0f0", padding: 16, borderRadius: 12, alignItems: "center" },
    closeModalText: { fontWeight: "600", color: "#333" },

    ratingBody: { alignItems: 'center' },
    ratingPrompt: { fontSize: 16, marginBottom: 20, textAlign: 'center' },
    starsContainer: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    commentInput: { width: '100%', height: 80, borderWidth: 1, borderColor: '#eee', borderRadius: 12, padding: 12, marginBottom: 20, textAlignVertical: 'top' },
    submitRatingBtn: { width: '100%', backgroundColor: '#4FD1C5', padding: 16, borderRadius: 12, alignItems: 'center' },
    submitRatingText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});