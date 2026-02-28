import { ScrollView, StyleSheet, Text, View } from "react-native";
import Header from "../components/layout/Header";

export default function WhyChoose() {
    return (
        <ScrollView style={{ backgroundColor: "#f7f7f6" }}>
            <Header />
            <View style={styles.container}>
                <Text style={styles.title}>Why Choose Chardho GO+</Text>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Real-Time Tracking</Text>
                    <Text style={styles.cardText}>Always know where your driver is.</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Multiple Payment Methods</Text>
                    <Text style={styles.cardText}>Convenient and flexible payments.</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Scheduled Rides</Text>
                    <Text style={styles.cardText}>Set your pickup in advance.</Text>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16 },
    title: { fontSize: 22, fontWeight: "800", marginBottom: 12 },
    card: {
        backgroundColor: "#fff",
        borderRadius: 10,
        borderColor: "#eee",
        borderWidth: 1,
        padding: 16,
        marginBottom: 12,
    },
    cardTitle: { fontWeight: "700", fontSize: 16 },
    cardText: { color: "#555" },
});
