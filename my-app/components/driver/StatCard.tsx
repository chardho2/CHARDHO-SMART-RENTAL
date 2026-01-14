import React from 'react';
import { View, Text, StyleSheet, ViewStyle, Platform, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSettings } from '../../context/SettingsContext';

interface StatCardProps {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor?: string;
    title: string;
    value: string | number;
    subtitle?: string;
    style?: StyleProp<ViewStyle>;
}

export default function StatCard({
    icon,
    iconColor = '#4FD1C5',
    title,
    value,
    subtitle,
    style,
}: StatCardProps) {
    const { colors, darkMode } = useSettings();

    const textStyles = {
        title: { color: colors.subText },
        value: { color: colors.text },
        subtitle: { color: colors.subText }
    };

    return (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>
            <View style={styles.iconContainer}>
                <LinearGradient
                    colors={[`${iconColor}20`, `${iconColor}10`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconGradient}
                >
                    <Ionicons name={icon} size={24} color={iconColor} />
                </LinearGradient>
            </View>
            <View style={styles.content}>
                <Text style={[styles.title, textStyles.title]}>{title}</Text>
                <Text style={[styles.value, textStyles.value]}>{value}</Text>
                {subtitle && <Text style={[styles.subtitle, textStyles.subtitle]}>{subtitle}</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOpacity: 0.08,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
            },
            android: {
                elevation: 3,
            },
            web: {
                boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
            },
        }),
    },
    iconContainer: {
        marginRight: 12,
        borderRadius: 20,
        overflow: 'hidden',
    },
    iconGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 10,
        color: '#666',
        marginBottom: 2,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: 18,
        fontWeight: '900',
        color: '#2C5364',
        marginBottom: 0,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 10,
        color: '#999',
        fontWeight: '500',
    },
});
