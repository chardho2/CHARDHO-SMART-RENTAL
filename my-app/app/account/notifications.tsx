import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    RefreshControl,
    StatusBar,
    Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from "expo-router";
import { userAPI } from "../../services/userAPI";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import EmptyState from "../../components/common/EmptyState";
import { socketService } from "../../services/socketService";
import { useSettings } from "../../context/SettingsContext";
import NotificationStats from "../../components/notifications/NotificationStats";
import NotificationFilters from "../../components/notifications/NotificationFilters";
import NotificationItem, { Notification } from "../../components/notifications/NotificationItem";

interface NotificationStatsData {
    total: number;
    unread: number;
    read: number;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
}

export default function UserNotifications() {
    const { colors, darkMode } = useSettings();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [stats, setStats] = useState<NotificationStatsData | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread'>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const isMounted = useRef(false);

    const categories = ['all', 'ride', 'payment', 'promotion', 'system'];

    const dynamicStyles = {
        container: { backgroundColor: colors.background },
    };

    useEffect(() => {
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

            const response = await userAPI.getNotificationsFiltered(params);

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
            const response = await userAPI.getNotificationStats();
            if (response.success) {
                setStats(response.stats);
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    };

    const loadUnreadCount = async () => {
        try {
            const response = await userAPI.getUnreadNotificationCount();
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
            await userAPI.markNotificationRead(notification._id);
            setNotifications(prev =>
                prev.map(n => n._id === notification._id ? { ...n, read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        // Navigate to action URL if available
        if (notification.actionUrl) {
            router.push(notification.actionUrl as any);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            const response = await userAPI.markAllNotificationsRead();
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
                            const response = await userAPI.clearAllReadNotifications();
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
            const response = await userAPI.deleteNotification(id);
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

    useEffect(() => {
        if (isMounted.current) {
            loadNotifications(1, false);
        } else {
            isMounted.current = true;
        }
    }, [selectedFilter, selectedCategory]);


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
            <NotificationStats stats={stats} />

            {/* Filters */}
            <NotificationFilters
                selectedFilter={selectedFilter}
                onFilterChange={setSelectedFilter}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={categories}
            />

            {/* Notifications List */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#667eea']} tintColor={colors.text} />
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
                        {notifications.map((notification) => (
                            <NotificationItem
                                key={notification._id}
                                notification={notification}
                                onPress={handleNotificationPress}
                                onDelete={handleDeleteNotification}
                            />
                        ))}
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
        backgroundColor: '#f7f7f6',
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
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    notificationsList: {
        gap: 12,
    },
    bottomPadding: {
        height: 24,
    },
});
