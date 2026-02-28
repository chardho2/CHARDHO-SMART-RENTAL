import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";

export default function ForgotPassword() {
    const { userType } = useLocalSearchParams();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendResetLink = async () => {
        // Validate email
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        console.log("Reset password requested for:", email, "Type:", userType);
        setLoading(true);

        try {
            // Call backend API
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.29.199:4000/api';
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.toLowerCase().trim(),
                    userType: userType || 'user'
                })
            });

            const data = await response.json();

            console.log('Reset password response:', data);

            if (data.success) {
                // Show success message
                Alert.alert(
                    'Email Sent! ✅',
                    'A password reset link has been sent to your email address. Please check your inbox and follow the instructions.\n\n(In development mode, check the server terminal for the reset link)',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.back()
                        }
                    ]
                );

                // Log reset info for development
                if (data.resetToken) {
                    console.log('🔐 Reset Token:', data.resetToken);
                    console.log('🔗 Reset URL:', data.resetUrl);
                }
            } else {
                Alert.alert('Error', data.message || 'Failed to send reset link. Please try again.');
            }
        } catch (error: any) {
            console.error('Reset password error:', error);
            Alert.alert(
                'Connection Error',
                'Unable to connect to server. Please check your internet connection and try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.page} contentContainerStyle={styles.container}>
            <Text style={styles.title}>Forgot Password</Text>

            <Text style={styles.description}>
                Enter your email address and we'll send you a link to reset your password.
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
            />

            <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleSendResetLink}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.btnText}>Send Reset Link</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.backBtn}
                onPress={() => router.back()}
                disabled={loading}
            >
                <Text style={styles.backBtnText}>Back to Login</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    page: { flex: 1, backgroundColor: "#f7f7f6" },

    container: {
        padding: 20,
        paddingTop: 80,
        paddingBottom: 40,
    },

    title: {
        fontSize: 28,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 15,
    },

    description: {
        fontSize: 14,
        color: "#666",
        textAlign: "center",
        marginBottom: 30,
        paddingHorizontal: 20,
        lineHeight: 20,
    },

    input: {
        backgroundColor: "#fff",
        padding: 15,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ddd",
        marginBottom: 15,
        fontSize: 16,
    },

    btn: {
        backgroundColor: "#D0BB95",
        padding: 16,
        alignItems: "center",
        borderRadius: 10,
        marginTop: 10,
    },

    btnDisabled: {
        opacity: 0.6,
    },

    btnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },

    backBtn: {
        padding: 16,
        alignItems: "center",
        marginTop: 15,
    },

    backBtnText: {
        color: "#666",
        fontWeight: "600",
        fontSize: 14,
    },
});
