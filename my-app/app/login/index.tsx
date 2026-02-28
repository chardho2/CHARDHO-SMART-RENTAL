import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get("window");

export default function LoginOptions() {
    return (
        <View style={styles.page}>
            <View style={styles.container}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Choose your account type to continue</Text>

                <View style={styles.optionsContainer}>
                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={() => router.push("/login/user" as any)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name="person" size={40} color="#8b6f46" />
                        </View>
                        <Text style={styles.cardTitle}>User</Text>
                        <Text style={styles.cardDescription}>Login as a passenger</Text>
                        <View style={styles.arrow}>
                            <Ionicons name="arrow-forward" size={20} color="#8b6f46" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.optionCard}
                        onPress={() => router.push("/login/driver" as any)}
                        activeOpacity={0.8}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name="car" size={40} color="#8b6f46" />
                        </View>
                        <Text style={styles.cardTitle}>Driver</Text>
                        <Text style={styles.cardDescription}>Login as a driver</Text>
                        <View style={styles.arrow}>
                            <Ionicons name="arrow-forward" size={20} color="#8b6f46" />
                        </View>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => router.push("/signup" as any)}>
                    <Text style={styles.bottomLink}>Don't have an account? <Text style={styles.linkBold}>Sign Up</Text></Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    page: {
        flex: 1,
        backgroundColor: "#f7f7f6",
    },
    container: {
        flex: 1,
        padding: 20,
        paddingTop: 80,
        alignItems: "center",
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
        marginBottom: 8,
        color: "#1a1a1a",
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        marginBottom: 40,
        textAlign: "center",
    },
    optionsContainer: {
        width: "100%",
        gap: 20,
        marginBottom: 30,
    },
    optionCard: {
        backgroundColor: "#fff",
        padding: 24,
        borderRadius: 16,
        width: "100%",
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        position: "relative",
    },
    iconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#f5f0e8",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#1a1a1a",
        marginBottom: 6,
    },
    cardDescription: {
        fontSize: 14,
        color: "#666",
        marginBottom: 12,
    },
    arrow: {
        position: "absolute",
        right: 24,
        top: "50%",
        marginTop: -10,
    },
    bottomLink: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
    },
    linkBold: {
        color: "#8b6f46",
        fontWeight: "700",
    },
});
