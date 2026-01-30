import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../context/SettingsContext";

export interface Notification {
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

interface NotificationItemProps {
    notification: Notification;
    onPress: (notification: Notification) => void;
    onDelete: (id: string) => void;
}

export default function NotificationItem({ notification, onPress, onDelete }: NotificationItemProps) {
    const { colors, darkMode } = useSettings();

    const dynamicStyles = {
        card: { backgroundColor: colors.card, borderColor: colors.border },
        text: { color: colors.text },
        subText: { color: colors.subText },
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
            promotion: { name: 'gift', color: '#FF9800' },
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

    const iconData = getNotificationIcon(notification.type);
    const priorityColor = getPriorityColor(notification.priority);

    return (
        <TouchableOpacity
            style={[
                styles.notificationCard,
                dynamicStyles.card,
                !notification.read && styles.unreadCard
            ]}
            onPress={() => onPress(notification)}
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
                        <Text style={styles.notificationTime}>
                            {getTimeAgo(notification.createdAt)}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={(e) => {
                            e.stopPropagation();
                            onDelete(notification._id);
                        }}
                    >
                        <Ionicons name="trash-outline" size={18} color={darkMode ? "#666" : "#999"} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    notificationCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#fff',
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
        color: '#1a1a1a',
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
        color: '#666',
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
        color: '#999',
    },
    deleteBtn: {
        padding: 4,
    },
});
