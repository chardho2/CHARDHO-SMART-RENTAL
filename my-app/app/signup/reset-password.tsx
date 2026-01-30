import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ResetPassword() {
    return (
        <ScrollView style={styles.page} contentContainerStyle={styles.container}>
            <Text style={styles.title}>Reset Password</Text>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Enter your email to reset password</Text>

                <TextInput style={styles.input} placeholder="Email Address" />

                <TouchableOpacity style={styles.btn}>
                    <Text style={styles.btnText}>Send Reset Link</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    page: { flex: 1, backgroundColor: "#f7f7f6" },

    container: {
        padding: 20,
        paddingTop: 60,
        paddingBottom: 40,
    },

    title: {
        fontSize: 30,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 20,
    },

    card: {
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 16,
        elevation: 5,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },

    cardTitle: {
        fontSize: 22,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 20,
    },

    input: {
        backgroundColor: "#fafafa",
        padding: 14,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ddd",
        marginBottom: 12,
    },

    link: {
        textAlign: "right",
        color: "#8b6f46",
        fontWeight: "600",
        marginBottom: 15,
    },

    btn: {
        backgroundColor: "#D0BB95",
        padding: 16,
        alignItems: "center",
        borderRadius: 10,
        marginBottom: 10,
    },

    btnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },

    bottomLink: {
        marginTop: 16,
        fontSize: 14,
        textAlign: "center",
        color: "#8b6f46",
        fontWeight: "600",
    },
});
