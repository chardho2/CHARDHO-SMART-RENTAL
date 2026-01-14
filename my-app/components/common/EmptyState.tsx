import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
    icon?: keyof typeof Ionicons.glyphMap;
    title: string;
    message: string;
    action?: React.ReactNode;
}

import { useSettings } from '../../context/SettingsContext';

export default function EmptyState({
    icon = 'file-tray-outline',
    title,
    message,
    action
}: EmptyStateProps) {
    const { colors } = useSettings();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.iconContainer}>
                <LinearGradient
                    colors={['rgba(79, 209, 197, 0.1)', 'rgba(102, 126, 234, 0.1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconGradient}
                >
                    <Ionicons name={icon} size={64} color="#667eea" />
                </LinearGradient>
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.message, { color: colors.subText }]}>{message}</Text>
            {action && <View style={styles.actionContainer}>{action}</View>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#f7f7f6',
    },
    iconContainer: {
        marginBottom: 24,
        borderRadius: 60,
        overflow: 'hidden',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    iconGradient: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#2C5364',
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
        maxWidth: 280,
    },
    actionContainer: {
        marginTop: 8,
    },
});
