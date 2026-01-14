import { ScrollView, StyleSheet, Text, View } from "react-native";
import Header from "../components/layout/Header";

export default function Vehicles() {
    return (
        <ScrollView style={{ backgroundColor: "#f7f7f6" }}>
            <Header />

            <View style={styles.container}>
                <Text style={styles.title}>A Ride for Every Need</Text>

                <View style={styles.item}>
                    <Text style={styles.vehicleTitle}>Bike</Text>
                    <Text style={styles.vehicleText}>Fastest through traffic.</Text>
                </View>

                <View style={styles.item}>
                    <Text style={styles.vehicleTitle}>Auto</Text>
                    <Text style={styles.vehicleText}>Affordable everyday rides.</Text>
                </View>

                <View style={styles.item}>
                    <Text style={styles.vehicleTitle}>Car</Text>
                    <Text style={styles.vehicleText}>Comfort & space for groups.</Text>
                </View>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16 },
    title: { fontSize: 22, fontWeight: "800", marginBottom: 12 },
    item: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#eee",
        marginBottom: 12,
    },
    vehicleTitle: { fontWeight: "700", fontSize: 16 },
    vehicleText: { color: "#555" },
});
