import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function DrawerContent() {
    return (
        <View style={styles.container}>

            {/* Profile */}
            <View style={styles.profile}>
                <View style={styles.avatar} />
                <Text style={styles.name}>Alex Morgan</Text>
                <Text style={styles.viewProfile}>View Profile</Text>
            </View>

            {/* Menu Items */}
            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/dashboard/index" as any)}>
                <MaterialIcons name="home" size={22} color="#fff" />
                <Text style={styles.menuText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/dashboard/book" as any)}>
                <MaterialIcons name="local-taxi" size={22} color="#fff" />
                <Text style={styles.menuText}>Book a Ride</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/dashboard/history" as any)}>
                <MaterialIcons name="history" size={22} color="#fff" />
                <Text style={styles.menuText}>My Rides</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/dashboard/wallet")}>
                <MaterialCommunityIcons name="wallet" size={22} color="#fff" />
                <Text style={styles.menuText}>Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/dashboard/support")}>
                <MaterialIcons name="support-agent" size={22} color="#fff" />
                <Text style={styles.menuText}>Support</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push("/dashboard/settings")}>
                <MaterialIcons name="settings" size={22} color="#fff" />
                <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>

            {/* SOS Button */}
            <TouchableOpacity style={styles.sosBtn} onPress={() => router.push("/dashboard/sos")}>
                <Text style={styles.sosText}>SOS</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#657683ff",
        paddingTop: 60,
    },

    profile: {
        alignItems: "center",
        marginBottom: 30,
    },
    avatar: {
        width: 65,
        height: 65,
        borderRadius: 40,
        backgroundColor: "#ddd",
    },
    name: {
        color: "#fff",
        fontSize: 18,
        marginTop: 10,
        fontWeight: "700",
    },
    viewProfile: {
        color: "#b0c7d6",
        fontSize: 13,
        marginTop: 4,
    },

    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 20,
        gap: 12,
    },
    menuText: {
        color: "#fff",
        fontSize: 16,
    },

    sosBtn: {
        marginTop: "auto",
        backgroundColor: "#e53935",
        paddingVertical: 14,
        alignItems: "center",
    },
    sosText: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 18,
    },
});
