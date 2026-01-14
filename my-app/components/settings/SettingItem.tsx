import React from "react";
import { StyleSheet, Text, View, TouchableOpacity, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../context/SettingsContext";

export interface SettingItemProps {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    type: 'toggle' | 'navigation' | 'action';
    value?: boolean;
    onPress?: () => void;
    onToggle?: (value: boolean) => void;
    color?: string;
}

export default function SettingItem({
    id,
    icon,
    title,
    subtitle,
    type,
    value,
    onPress,
    onToggle,
    color
}: SettingItemProps) {
    const { colors, darkMode } = useSettings();

    const dynamicStyles = {
        card: { backgroundColor: colors.card, shadowColor: darkMode ? '#000' : '#ccc' },
        text: { color: colors.text },
        subText: { color: colors.subText },
    };

    return (
        <TouchableOpacity
            key={id}
            style={[styles.settingItem, dynamicStyles.card]}
            onPress={type === 'navigation' || type === 'action' ? onPress : undefined}
            activeOpacity={type === 'toggle' ? 1 : 0.7}
        >
            <View style={[styles.settingIcon, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, dynamicStyles.text]}>{title}</Text>
                {subtitle && (
                    <Text style={[styles.settingSubtitle, dynamicStyles.subText]}>{subtitle}</Text>
                )}
            </View>
            {type === 'toggle' && (
                <Switch
                    value={value}
                    onValueChange={onToggle}
                    trackColor={{ false: '#ccc', true: color || '#4FD1C5' }}
                    thumbColor="#fff"
                />
            )}
            {type === 'navigation' && (
                <Ionicons name="chevron-forward" size={20} color={colors.subText} />
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    settingIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 12,
        fontWeight: '500',
    },
});
