import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../../context/SettingsContext";

interface UserProfile {
    name: string;
    email?: string;
    phone?: string;
}

interface UserStats {
    memberSince: string;
}

interface ProfileCardProps {
    user: UserProfile;
    stats: UserStats | null;
    onEditProfile: () => void;
}

export default function ProfileCard({ user, stats, onEditProfile }: ProfileCardProps) {
    const { colors, darkMode } = useSettings();

    const formatMemberSince = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        });
    };

    const dynamicStyles = {
        card: { backgroundColor: colors.card, borderColor: colors.border },
        text: { color: colors.text },
        subText: { color: colors.subText },
        iconBg: { backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(79, 209, 197, 0.15)' }
    };

    return (
        <View style={styles.profileCardContainer}>
            <View style={[styles.profileCard, dynamicStyles.card]}>
                <View style={styles.avatarContainer}>
                    <View style={[styles.avatar, dynamicStyles.iconBg]}>
                        <Ionicons name="person" size={40} color="#4FD1C5" />
                    </View>
                    <TouchableOpacity style={styles.editAvatarBtn}>
                        <Ionicons name="camera" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>
                <View style={styles.profileInfo}>
                    <Text style={[styles.name, dynamicStyles.text]}>{user.name}</Text>
                    <Text style={[styles.email, dynamicStyles.subText]}>{user.email}</Text>
                    {user.phone && (
                        <Text style={[styles.phone, dynamicStyles.subText]}>
                            <Ionicons name="call" size={12} color={colors.subText} /> {user.phone}
                        </Text>
                    )}
                    {stats && (
                        <View style={styles.memberBadge}>
                            <Ionicons name="ribbon" size={12} color="#FFD700" />
                            <Text style={styles.memberSince}>
                                Member since {formatMemberSince(stats.memberSince)}
                            </Text>
                        </View>
                    )}
                </View>
                <TouchableOpacity style={[styles.editProfileBtn, dynamicStyles.iconBg]} onPress={onEditProfile}>
                    <Ionicons name="create-outline" size={20} color="#4FD1C5" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    profileCardContainer: {
        paddingHorizontal: 20,
        marginBottom: 24,
        zIndex: 2,
    },
    profileCard: {
        flexDirection: "row",
        alignItems: "center",
        padding: 24,
        backgroundColor: "#fff",
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
        elevation: 8,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
    },
    avatarContainer: {
        position: "relative",
        marginRight: 16,
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: "rgba(79, 209, 197, 0.15)",
        justifyContent: "center",
        alignItems: "center",
    },
    editAvatarBtn: {
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#4FD1C5",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#fff",
    },
    profileInfo: {
        flex: 1,
    },
    name: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1a1a1a",
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: "#666",
        marginBottom: 4,
    },
    phone: {
        fontSize: 13,
        color: "#666",
        marginBottom: 4,
    },
    memberBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "rgba(255, 215, 0, 0.1)", // Gold tint
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
    memberSince: {
        fontSize: 12,
        color: "#bfa100", // Goldish color
        fontWeight: "600",
    },
    editProfileBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(79, 209, 197, 0.15)",
        justifyContent: "center",
        alignItems: "center",
    },
});
