import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RouteOption } from '../../services/routing';
import { useSettings } from '../../context/SettingsContext';

interface RouteSelectionModalProps {
    visible: boolean;
    onClose: () => void;
    onSelectRoute: (route: RouteOption) => void;
    routes: RouteOption[];
    recommended: 'fastest' | 'shortest' | 'balanced';
    loading?: boolean;
}

export default function RouteSelectionModal({
    visible,
    onClose,
    onSelectRoute,
    routes,
    recommended,
    loading = false
}: RouteSelectionModalProps) {
    const { colors, darkMode } = useSettings();
    const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);

    const getRouteIcon = (type: string) => {
        switch (type) {
            case 'fastest':
                return 'speedometer';
            case 'shortest':
                return 'cash';
            case 'balanced':
                return 'scale-balance';
            default:
                return 'map-marker-path';
        }
    };

    const getRouteColor = (type: string) => {
        switch (type) {
            case 'fastest':
                return '#4FD1C5';
            case 'shortest':
                return '#48BB78';
            case 'balanced':
                return '#ED8936';
            default:
                return '#718096';
        }
    };

    const handleSelectRoute = (route: RouteOption) => {
        setSelectedRoute(route);
        onSelectRoute(route);
        onClose();
    };

    const dynamicStyles = {
        container: { backgroundColor: colors.card },
        text: { color: colors.text },
        subText: { color: colors.subText },
        border: { borderColor: colors.border },
        cardBg: { backgroundColor: darkMode ? '#2C2C2C' : '#fff' },
        iconBg: { backgroundColor: darkMode ? '#333' : '#f5f5f5' }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, dynamicStyles.container]}>
                    {/* Header */}
                    <View style={[styles.header, dynamicStyles.border]}>
                        <View style={styles.headerLeft}>
                            <MaterialCommunityIcons name="map-marker-path" size={24} color="#4FD1C5" />
                            <Text style={[styles.title, dynamicStyles.text]}>Choose Your Route</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.subtitle, dynamicStyles.subText]}>
                        Select the best route for your trip
                    </Text>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#4FD1C5" />
                            <Text style={[styles.loadingText, dynamicStyles.subText]}>Calculating routes...</Text>
                        </View>
                    ) : (
                        <ScrollView style={styles.routesList} showsVerticalScrollIndicator={false}>
                            {routes.map((route, index) => {
                                const isRecommended = route.type === recommended;
                                const routeColor = getRouteColor(route.type);

                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.routeCard,
                                            dynamicStyles.cardBg,
                                            dynamicStyles.border,
                                            isRecommended && styles.recommendedCard
                                        ]}
                                        onPress={() => handleSelectRoute(route)}
                                        activeOpacity={0.7}
                                    >
                                        {isRecommended && (
                                            <View style={styles.recommendedBadge}>
                                                <Ionicons name="star" size={12} color="#fff" />
                                                <Text style={styles.recommendedText}>RECOMMENDED</Text>
                                            </View>
                                        )}

                                        <View style={styles.routeHeader}>
                                            <View style={styles.routeIconContainer}>
                                                <View style={[styles.routeIconBg, { backgroundColor: `${routeColor}20` }]}>
                                                    <MaterialCommunityIcons
                                                        name={getRouteIcon(route.type) as any}
                                                        size={28}
                                                        color={routeColor}
                                                    />
                                                </View>
                                                <View style={styles.routeTitleContainer}>
                                                    <Text style={[styles.routeName, dynamicStyles.text]}>{route.name}</Text>
                                                    <Text style={[styles.routeDescription, dynamicStyles.subText]}>{route.description}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        <View style={[styles.routeMetrics, dynamicStyles.border]}>
                                            {/* Distance */}
                                            <View style={styles.metricItem}>
                                                <View style={[styles.metricIconContainer, dynamicStyles.iconBg]}>
                                                    <Ionicons name="navigate" size={18} color={colors.subText} />
                                                </View>
                                                <View>
                                                    <Text style={[styles.metricLabel, dynamicStyles.subText]}>Distance</Text>
                                                    <Text style={[styles.metricValue, dynamicStyles.text]}>{route.distance} km</Text>
                                                </View>
                                            </View>

                                            {/* Duration */}
                                            <View style={styles.metricItem}>
                                                <View style={[styles.metricIconContainer, dynamicStyles.iconBg]}>
                                                    <Ionicons name="time" size={18} color={colors.subText} />
                                                </View>
                                                <View>
                                                    <Text style={[styles.metricLabel, dynamicStyles.subText]}>Duration</Text>
                                                    <Text style={[styles.metricValue, dynamicStyles.text]}>{route.duration} min</Text>
                                                </View>
                                            </View>

                                            {/* Cost */}
                                            <View style={styles.metricItem}>
                                                <View style={[styles.metricIconContainer, dynamicStyles.iconBg]}>
                                                    <Ionicons name="cash" size={18} color={colors.subText} />
                                                </View>
                                                <View>
                                                    <Text style={[styles.metricLabel, dynamicStyles.subText]}>Est. Cost</Text>
                                                    <Text style={[styles.metricValue, dynamicStyles.text]}>₹{route.estimatedCost}</Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* Savings Info */}
                                        {route.savings && (route.savings.moneySaved! > 0 || route.savings.timeSaved! > 0) && (
                                            <View style={styles.savingsContainer}>
                                                {route.savings.moneySaved! > 0 && (
                                                    <View style={styles.savingsBadge}>
                                                        <Ionicons name="trending-down" size={14} color="#48BB78" />
                                                        <Text style={styles.savingsText}>
                                                            Save ₹{route.savings.moneySaved}
                                                        </Text>
                                                    </View>
                                                )}
                                                {route.savings.timeSaved! > 0 && (
                                                    <View style={styles.savingsBadge}>
                                                        <Ionicons name="flash" size={14} color="#4FD1C5" />
                                                        <Text style={styles.savingsText}>
                                                            {route.savings.timeSaved} min faster
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}

                                        {/* Select Button */}
                                        <TouchableOpacity
                                            style={[styles.selectButton, { backgroundColor: routeColor }]}
                                            onPress={() => handleSelectRoute(route)}
                                        >
                                            <Text style={styles.selectButtonText}>Select This Route</Text>
                                            <Ionicons name="arrow-forward" size={18} color="#fff" />
                                        </TouchableOpacity>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '85%',
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    closeBtn: {
        padding: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 8,
    },
    loadingContainer: {
        padding: 60,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    routesList: {
        padding: 16,
    },
    routeCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#f0f0f0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    recommendedCard: {
        borderColor: '#4FD1C5',
    },
    recommendedBadge: {
        position: 'absolute',
        top: -8,
        right: 16,
        backgroundColor: '#4FD1C5',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        shadowColor: '#4FD1C5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    recommendedText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    routeHeader: {
        marginBottom: 16,
    },
    routeIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    routeIconBg: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    routeTitleContainer: {
        flex: 1,
    },
    routeName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    routeDescription: {
        fontSize: 13,
        color: '#666',
    },
    routeMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#f0f0f0',
    },
    metricItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    metricIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: 11,
        color: '#999',
        marginBottom: 2,
    },
    metricValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    savingsContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    savingsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#f0fdf4',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#48BB7820',
    },
    savingsText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#48BB78',
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 14,
        borderRadius: 12,
    },
    selectButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
