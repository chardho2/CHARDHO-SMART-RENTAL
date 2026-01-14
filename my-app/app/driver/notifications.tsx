import React, { useState, useEffect, useCallback } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    RefreshControl,
    StatusBar,
    Alert,
    Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from "expo-router";
import { driverAPI } from "../../services/driverAPI";
import { useSettings } from "../../context/SettingsContext";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { socketService } from "../../services/socketService";

const { width } = Dimensions.get('window');

interface Notification {
    _id: string;
    title: string;
    message: string;
    type: string;
    category: string;
    priority: string;
    read: boolean;
    actionUrl?: string;
    metadata?: any;
    createdAt: string;
}

interface NotificationStats {
    total: number;
    unread: number;
    read: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
}

export default function Notifications() {
    const { colors, darkMode } = useSettings();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [stats, setStats] = useState<NotificationStats | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread'>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        loadNotifications();
        loadStats();
        setupSocketListeners();

        return () => {
            const socket = socketService.getSocket();
            socket?.off('new_notification');
        };
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadNotifications();
            loadUnreadCount();
        }, [])
    );

    const setupSocketListeners = () => {
        const socket = socketService.getSocket();
        socket?.on('new_notification', (notification: Notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            loadStats();
        });
    };

    const loadNotifications = async (pageNum = 1, append = false) => {
        try {
            if (!append) setLoading(true);

            const params: any = {
                page: pageNum,
                limit: 20,
            };

            if (selectedFilter === 'unread') {
                params.unreadOnly = true;
            }

            if (selectedCategory !== 'all') {
                params.category = selectedCategory;
            }

            const response = await driverAPI.getNotificationsFiltered(params);

            if (response.success) {
                const newNotifications = response.notifications || [];

                if (append) {
                    setNotifications(prev => [...prev, ...newNotifications]);
                } else {
                    setNotifications(newNotifications);
                }

                setUnreadCount(response.unreadCount || 0);
                setHasMore(newNotifications.length === 20);
                setPage(pageNum);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const response = await driverAPI.getNotificationStats();
            if (response.success) {
                setStats(response.stats);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const loadUnreadCount = async () => {
        try {
            const response = await driverAPI.getUnreadNotificationCount();
            if (response.success) {
                setUnreadCount(response.count);
            }
        } catch (error) {
            console.error('Error loading unread count:', error);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([loadNotifications(1, false), loadStats()]);
        setRefreshing(false);
    }, [selectedFilter, selectedCategory]);

    const handleNotificationPress = async (notification: Notification) => {
        // Mark as read if unread
        if (!notification.read) {
            await driverAPI.markNotificationRead(notification._id);
            setNotifications(prev =>
                prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        // Navigate to action URL if available
        if (notification.actionUrl) {
            try {
                // Map backend routes to Expo Router routes
                let route = notification.actionUrl;

                // Handle driver routes
                if (route.startsWith('/driver/')) {
                    // Convert /driver/... to /(driver)/...
                    route = route.replace('/driver/', '/(driver)/');
                }
                // Handle user routes
                else if (route.startsWith('/booking/')) {
                    route = route.replace('/booking/', '/(tabs)/booking/');
                }
                else if (route.startsWith('/trips')) {
                    route = '/(tabs)/trips';
                }
                else if (route.startsWith('/account/')) {
                    route = route.replace('/account/', '/(tabs)/account/');
                }

                console.log('📍 Navigating from notification:', notification.actionUrl, '→', route);
                router.push({ pathname: route } as any);
            } catch (error) {
                console.error('Navigation error:', error);
                // Fallback to dashboard if navigation fails
                router.push({ pathname: '/(driver)/tabs/dashboard' } as any);
            }
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const response = await driverAPI.markAllNotificationsRead();
            if (response.success) {
                setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                setUnreadCount(0);
                Alert.alert('Success', 'All notifications marked as read');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to mark all as read');
        }
    };

    const handleClearAll = async () => {
        Alert.alert(
            'Clear All Read',
            'Are you sure you want to clear all read notifications?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await driverAPI.clearAllReadNotifications();
                            if (response.success) {
                                setNotifications(prev => prev.filter(n => !n.read));
                                Alert.alert('Success', `${response.deletedCount} notifications cleared`);
                            }
                        } catch (error) {
                            Alert.alert('Error', 'Failed to clear notifications');
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteNotification = async (id: string) => {
        try {
            const response = await driverAPI.deleteNotification(id);
            if (response.success) {
                setNotifications(prev => prev.filter(n => n._id !== id));
                if (response.unreadCount !== undefined) {
                    setUnreadCount(response.unreadCount);
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to delete notification');
        }
    };

    const loadMore = () => {
        if (hasMore && !loading) {
            loadNotifications(page + 1, true);
        }
    };

    const getTimeAgo = (date: string) => {
        const now = new Date();
        const notifDate = new Date(date);
        const diffMs = now.getTime() - notifDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return notifDate.toLocaleDateString();
    };

    const getNotificationIcon = (type: string) => {
        const iconMap: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
            ride_request: { name: 'car', color: '#4CAF50' },
            ride_accepted: { name: 'checkmark-circle', color: '#4CAF50' },
            ride_started: { name: 'play-circle', color: '#2196F3' },
            ride_completed: { name: 'checkmark-done-circle', color: '#4CAF50' },
            ride_cancelled: { name: 'close-circle', color: '#f44336' },
            payment_received: { name: 'cash', color: '#4CAF50' },
            payment_pending: { name: 'time', color: '#FF9800' },
            document_verified: { name: 'shield-checkmark', color: '#4CAF50' },
            document_rejected: { name: 'shield', color: '#f44336' },
            profile_update: { name: 'person', color: '#2196F3' },
            system_update: { name: 'information-circle', color: '#667eea' },
            promotion: { name: 'gift', color: '#FF9800' },
            missed_ride: { name: 'alert-circle', color: '#FF9800' },
            info: { name: 'information-circle', color: '#2196F3' },
            alert: { name: 'warning', color: '#FF9800' },
            success: { name: 'checkmark-circle', color: '#4CAF50' },
            warning: { name: 'alert', color: '#FF9800' },
            error: { name: 'close-circle', color: '#f44336' },
        };

        return iconMap[type] || { name: 'notifications', color: '#667eea' };
    };

    const getPriorityColor = (priority: string) => {
        const colorMap: Record<string, string> = {
            urgent: '#f44336',
            high: '#FF9800',
            medium: '#2196F3',
            low: '#9E9E9E',
        };
        return colorMap[priority] || '#2196F3';
    };

    const categories = ['all', 'ride', 'payment', 'account', 'system', 'promotion'];

    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        card: { backgroundColor: colors.card, shadowColor: darkMode ? '#000' : '#ccc' },
        text: { color: colors.text },
        subText: { color: colors.subText },
    };

    if (loading && notifications.length === 0) {
        return <LoadingSpinner text="Loading notifications..." />;
    }

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
                        <Text style={styles.headerTitle}>Notifications</Text>
                        <Text style={styles.headerSubtitle}>
                            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                        </Text>
                    </View>
                    <View style={styles.headerActions}>
                        {unreadCount > 0 && (
                            <TouchableOpacity
                                style={styles.headerActionBtn}
                                onPress={handleMarkAllRead}
                            >
                                <Ionicons name="checkmark-done" size={24} color="#fff" />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={styles.headerActionBtn}
                            onPress={handleClearAll}
                        >
                            <Ionicons name="trash-outline" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>

            {/* Stats Cards */}
            {stats && (
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
            )}

            {/* Filters */}
            <View style={styles.filtersContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            selectedFilter === 'all' && styles.filterChipActive
                        ]}
                        onPress={() => {
                            setSelectedFilter('all');
                            loadNotifications(1, false);
                        }}
                    >
                        <Text style={[
                            styles.filterChipText,
                            selectedFilter === 'all' && styles.filterChipTextActive
                        ]}>All</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.filterChip,
                            selectedFilter === 'unread' && styles.filterChipActive
                        ]}
                        onPress={() => {
                            setSelectedFilter('unread');
                            loadNotifications(1, false);
                        }}
                    >
                        <Text style={[
                            styles.filterChipText,
                            selectedFilter === 'unread' && styles.filterChipTextActive
                        ]}>Unread</Text>
                    </TouchableOpacity>
                </ScrollView>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                    {categories.map((category) => (
                        <TouchableOpacity
                            key={category}
                            style={[
                                styles.categoryChip,
                                selectedCategory === category && styles.categoryChipActive
                            ]}
                            onPress={() => {
                                setSelectedCategory(category);
                                loadNotifications(1, false);
                            }}
                        >
                            <Text style={[
                                styles.categoryChipText,
                                selectedCategory === category && styles.categoryChipTextActive
                            ]}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Notifications List */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#667eea']} />
                }
                onScroll={({ nativeEvent }) => {
                    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
                    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
                    if (isCloseToBottom) {
                        loadMore();
                    }
                }}
                scrollEventThrottle={400}
            >
                {notifications.length === 0 ? (
                    <EmptyState
                        icon="notifications-outline"
                        title="No Notifications"
                        message={selectedFilter === 'unread'
                            ? "You're all caught up! No unread notifications."
                            : "You don't have any notifications yet"}
                    />
                ) : (
                    <View style={styles.notificationsList}>
                        {notifications.map((notification) => {
                            const iconData = getNotificationIcon(notification.type);
                            const priorityColor = getPriorityColor(notification.priority);

                            return (
                                <TouchableOpacity
                                    key={notification._id}
                                    style={[
                                        styles.notificationCard,
                                        dynamicStyles.card,
                                        !notification.read && styles.unreadCard
                                    ]}
                                    onPress={() => handleNotificationPress(notification)}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.notificationIcon, { backgroundColor: `${iconData.color}15` }]}>
                                        <Ionicons name={iconData.name} size={24} color={iconData.color} />
                                    </View>

                                    <View style={styles.notificationContent}>
                                        <View style={styles.notificationHeader}>
                                            <Text style={[styles.notificationTitle, dynamicStyles.text]}>
                                                {notification.title}
                                            </Text>
                                            {!notification.read && (
                                                <View style={styles.unreadDot} />
                                            )}
                                        </View>

                                        <Text style={[styles.notificationMessage, dynamicStyles.subText]} numberOfLines={2}>
                                            {notification.message}
                                        </Text>

                                        <View style={styles.notificationFooter}>
                                            <View style={styles.notificationMeta}>
                                                <View style={[styles.priorityBadge, { backgroundColor: `${priorityColor}15` }]}>
                                                    <Text style={[styles.priorityText, { color: priorityColor }]}>
                                                        {notification.priority}
                                                    </Text>
                                                </View>
                                                <Text style={[styles.notificationTime, dynamicStyles.subText]}>
                                                    {getTimeAgo(notification.createdAt)}
                                                </Text>
                                            </View>

                                            <TouchableOpacity
                                                style={styles.deleteBtn}
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteNotification(notification._id);
                                                }}
                                            >
                                                <Ionicons name="trash-outline" size={18} color={colors.subText} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

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
        paddingBottom: 20,
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
    headerActions: {
        flexDirection: 'row',
        gap: 8,
    },
    headerActionBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
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
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    filtersContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    filterScroll: {
        marginBottom: 8,
    },
    categoryScroll: {
        marginTop: 4,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        marginRight: 8,
    },
    filterChipActive: {
        backgroundColor: '#667eea',
    },
    filterChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#667eea',
    },
    filterChipTextActive: {
        color: '#fff',
    },
    categoryChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: 'rgba(102, 126, 234, 0.08)',
        marginRight: 8,
    },
    categoryChipActive: {
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
    },
    categoryChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#667eea',
    },
    categoryChipTextActive: {
        color: '#667eea',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    notificationsList: {
        gap: 12,
    },
    notificationCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        gap: 12,
    },
    unreadCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#667eea',
    },
    notificationIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationContent: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 8,
    },
    notificationTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#667eea',
    },
    notificationMessage: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: '500',
        marginBottom: 8,
    },
    notificationFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    notificationMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    notificationTime: {
        fontSize: 12,
        fontWeight: '500',
    },
    deleteBtn: {
        padding: 4,
    },
    bottomPadding: {
        height: 24,
    },
});
