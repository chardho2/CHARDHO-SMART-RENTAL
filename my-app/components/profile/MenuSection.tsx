import React, { ReactNode } from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSettings } from "../../context/SettingsContext";

interface MenuItemProps {
    iconFamily: 'Ionicons' | 'MaterialIcons';
    iconName: string;
    iconColor: string;
    title: string;
    onPress?: () => void;
    showBorder?: boolean;
}

export const MenuItem = ({ iconFamily, iconName, iconColor, title, onPress, showBorder = true }: MenuItemProps) => {
    const { colors } = useSettings();
    const dynamicStyles = {
        text: { color: colors.text },
        border: { borderColor: colors.border },
    };

    return (
        <TouchableOpacity
            style={[styles.menuItem, dynamicStyles.border, !showBorder && { borderBottomWidth: 0 }]}
            onPress={onPress}
        >
            {iconFamily === 'Ionicons' ? (
                <Ionicons name={iconName as any} size={24} color={iconColor} />
            ) : (
                <MaterialIcons name={iconName as any} size={24} color={iconColor} />
            )}
            <Text style={[styles.menuText, dynamicStyles.text]}>{title}</Text>
            <MaterialIcons name="chevron-right" size={24} color={colors.subText} />
        </TouchableOpacity>
    );
};

interface MenuSectionProps {
    title: string;
    children: ReactNode;
}

export default function MenuSection({ title, children }: MenuSectionProps) {
    const { colors } = useSettings();
    const dynamicStyles = {
        text: { color: colors.text },
        card: { backgroundColor: colors.card, borderColor: colors.border },
        border: { borderColor: colors.border },
    };

    return (
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>{title}</Text>
            <View style={[styles.menuSection, dynamicStyles.card, dynamicStyles.border]}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        padding: 16,
        paddingTop: 0,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1a1a1a",
        marginBottom: 12,
    },
    menuSection: {
        backgroundColor: "#fff",
        borderRadius: 12,
        overflow: "hidden",
        elevation: 1,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        borderWidth: 1,
        borderColor: 'transparent'
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#f5f5f5",
    },
    menuText: {
        flex: 1,
        marginLeft: 16,
        fontSize: 16,
        fontWeight: "600",
        color: "#1a1a1a",
    },
});
