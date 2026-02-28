import { router } from "expo-router";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useDriverApp } from "../../context/DriverAppContext";

export default function TripRequestBottomSheet({ visible = false, onClose = () => { } }: any) {
    const { acceptBooking } = useDriverApp();
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    <Text style={styles.title}>Incoming Ride Request</Text>
                    <Text style={{ marginTop: 8, color: "#666" }}>Passenger: Emily R.</Text>
                    <Text style={{ marginTop: 4, color: "#666" }}>Pickup: 123 Main Street</Text>
                    <Text style={{ marginTop: 4, color: "#666" }}>Drop-off: 456 Oak Avenue</Text>

                    <View style={{ flexDirection: "row", marginTop: 16, gap: 12 }}>
                        <TouchableOpacity style={styles.decline} onPress={onClose}>
                            <Text style={{ color: "#333", fontWeight: "700" }}>Decline</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.accept} onPress={() => { onClose(); /* accept booking */ }}>
                            <Text style={{ color: "#fff", fontWeight: "800" }}>Accept</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        style={styles.accept}
                        onPress={() => {
                            acceptBooking({
                                id: "REQ-001",
                                passengerName: "Emily R.",
                                pickup: "123 Main Street",
                                dropoff: "456 Oak Avenue",
                                fare: 15.75,
                            });

                            onClose();
                            router.push("/driver/current-trip");
                        }}
                    >
                        <Text style={{ color: "#fff", fontWeight: "800" }}>Accept</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}


const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
    sheet: {
        backgroundColor: "#fff",
        padding: 18,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        borderWidth: 1,
        borderColor: "#eee",
    },
    title: { fontSize: 18, fontWeight: "800" },
    decline: {
        flex: 1,
        backgroundColor: "#eee",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    accept: {
        flex: 1,
        backgroundColor: "#8b6f46",
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
});
