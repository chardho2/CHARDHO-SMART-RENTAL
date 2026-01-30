import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import SafetyWidget from "../common/SafetyWidget";
import ChardhoLogo from "../common/ChardhoLogo";
import { useSettings } from "../../context/SettingsContext";

export default function Header({ hasActiveRide }: { hasActiveRide?: boolean }) {
    const { user } = useAuth();
    const { colors, darkMode } = useSettings();

    const dynamicStyles = {
        header: { backgroundColor: colors.card, borderColor: colors.border },
        text: { color: colors.text }
    };

    return (
        <View style={[styles.header, dynamicStyles.header]}>
            <View style={styles.left}>
                <ChardhoLogo size={40} />
                <Text style={[styles.title, dynamicStyles.text]}>Chardho GO+</Text>
            </View>

            <View style={styles.right}>
                {hasActiveRide && (
                    <View style={styles.safetyWrapper}>
                        <SafetyWidget variant="header" color={darkMode ? "#fff" : "#2C5364"} />
                    </View>
                )}
                {user && user.userType === 'user' ? (
                    <TouchableOpacity
                        style={[styles.profileBtn, hasActiveRide && styles.profileBtnCompact]}
                        onPress={() => router.push("/(tabs)/profile" as any)}
                    >
                        {!hasActiveRide && (
                            <Text style={[styles.greeting, dynamicStyles.text]} numberOfLines={1}>
                                Hi, {user.name.split(' ')[0]}
                            </Text>
                        )}
                        <View style={styles.avatarSmall}>
                            <Ionicons name="person" size={16} color="#fff" />
                        </View>
                    </TouchableOpacity>
                ) : (
                    <>
                        <TouchableOpacity onPress={() => router.push("/login" as any)}>
                            <Text style={styles.link}>Login</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push("/signup" as any)}
                            style={styles.signupBtn}
                        >
                            <LinearGradient
                                colors={['#4FD1C5', '#38B2AC']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.signupGradient}
                            >
                                <Text style={styles.signupText}>Sign Up</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </>
                )}
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        paddingTop: 40,
        paddingBottom: 15,
        paddingHorizontal: 20,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderColor: "#eee",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    left: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        marginRight: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: "800",
        color: "#2C5364",
        letterSpacing: -0.5,
        marginLeft: 8,
    },
    right: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    link: {
        fontSize: 15,
        color: "#4FD1C5",
        fontWeight: "600"
    },
    signupBtn: {
        borderRadius: 8,
        overflow: 'hidden',
        shadowColor: "#4FD1C5",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    signupGradient: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    signupText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 14,
    },
    profileBtn: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(79, 209, 197, 0.12)",
        paddingVertical: 6,
        paddingLeft: 10,
        paddingRight: 6,
        borderRadius: 20,
        gap: 8,
        borderWidth: 0,
        shadowColor: "#4FD1C5",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 1,
    },
    profileBtnCompact: {
        paddingHorizontal: 6,
        paddingVertical: 6,
        gap: 0,
        backgroundColor: "transparent",
        borderWidth: 0,
        shadowOpacity: 0,
        elevation: 0,
    },
    greeting: {
        fontSize: 13,
        fontWeight: "600",
        color: "#2C5364",
        maxWidth: 90,
        letterSpacing: -0.2,
    },
    avatarSmall: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#4FD1C5",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 0,
        shadowColor: "#4FD1C5",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 2,
    },
    safetyWrapper: {
        marginRight: 4,
    }
});
