import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Header from "../components/layout/Header";

export default function Contact() {
    function send() {
        Alert.alert("Message sent", "Thank you for contacting us!");
    }

    return (
        <ScrollView style={{ backgroundColor: "#f7f7f6" }}>
            <Header />

            <View style={styles.container}>
                <Text style={styles.title}>Get in Touch</Text>

                <TextInput placeholder="Your Name" style={styles.input} />
                <TextInput placeholder="Your Email" style={styles.input} />
                <TextInput placeholder="Your Message" style={[styles.input, { height: 120 }]} multiline />

                <TouchableOpacity style={styles.btn} onPress={send}>
                    <Text style={styles.btnText}>Submit</Text>
                </TouchableOpacity>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16 },
    title: { fontSize: 22, fontWeight: "800", marginBottom: 10 },
    input: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
        borderColor: "#eee",
        borderWidth: 1,
    },
    btn: {
        backgroundColor: "#D0BB95",
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
        marginTop: 6,
    },
    btnText: { color: "#fff", fontWeight: "700" },
});
