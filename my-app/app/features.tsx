import { View, Text, StyleSheet, ScrollView } from "react-native";
import Header from "../components/layout/Header";

export default function Features() {
  return (
    <ScrollView style={{ backgroundColor: "#f7f7f6" }}>
      <Header />
      <View style={styles.container}>

        <Text style={styles.title}>Everything you need in one app</Text>
        <Text style={styles.subtitle}>
          Smart features built for comfort, safety and convenience.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Real-Time Tracking</Text>
          <Text style={styles.cardText}>Know exactly where your ride is.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Multiple Payment Options</Text>
          <Text style={styles.cardText}>Wallet, cards, cash and more.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pre-Scheduled Rides</Text>
          <Text style={styles.cardText}>Plan your trips ahead.</Text>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 6 },
  subtitle: { color: "#555", marginBottom: 14 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderColor: "#eee",
    borderWidth: 1,
  },
  cardTitle: { fontWeight: "700", marginBottom: 4 },
  cardText: { color: "#555" },
});
