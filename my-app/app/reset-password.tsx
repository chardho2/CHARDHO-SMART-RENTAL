import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, Alert, ActivityIndicator, View } from "react-native";
import { AuthInput } from "../components/auth/AuthInput";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function ResetPasswordScreen() {
    // Get params from deep link
    const { token, type } = useLocalSearchParams();

    // State
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({ password: '', confirmPassword: '' });

    const validateForm = () => {
        let isValid = true;
        const newErrors = { password: '', confirmPassword: '' };

        if (!password) {
            newErrors.password = 'Password is required';
            isValid = false;
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
            isValid = false;
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
            isValid = false;
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleResetPassword = async () => {
        if (!validateForm()) return;

        if (!token) {
            Alert.alert("Error", "Invalid or missing reset token. Please request a new link.");
            return;
        }

        setLoading(true);

        try {
            const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.29.199:4000/api';

            console.log('Resetting password with:', {
                token: token.toString().substring(0, 10) + '...',
                userType: type
            });

            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    userType: type || 'user',
                    newPassword: password
                })
            });

            const data = await response.json();

            if (data.success) {
                Alert.alert(
                    "Success! 🎉",
                    "Your password has been reset successfully. Please login with your new password.",
                    [
                        {
                            text: "Login Now",
                            onPress: () => {
                                // Navigate to appropriate login screen
                                if (type === 'driver') {
                                    router.replace("/login/driver");
                                } else {
                                    router.replace("/login/user");
                                }
                            }
                        }
                    ]
                );
            } else {
                Alert.alert("Error", data.message || "Failed to reset password");
            }

        } catch (error) {
            console.error("Reset password error:", error);
            Alert.alert("Connection Error", "Unable to connect to server. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.replace("/login")}
                        style={styles.backButton}
                    >
                        <Ionicons name="close" size={24} color="#1a1a1a" />
                    </TouchableOpacity>
                    <View style={styles.headerTitles}>
                        <Text style={styles.welcomeText}>Set New Password</Text>
                        <Text style={styles.subtitleText}>
                            Create a strong, unique password for your account.
                        </Text>
                    </View>
                </View>

                {/* Form */}
                <View style={styles.formContainer}>
                    <AuthInput
                        icon="lock-closed-outline"
                        placeholder="New Password"
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            setErrors(prev => ({ ...prev, password: '' }));
                        }}
                        isPassword
                        showPassword={showPassword}
                        onTogglePassword={() => setShowPassword(!showPassword)}
                        error={errors.password}
                        touched={!!errors.password}
                    />

                    <AuthInput
                        icon="lock-closed-outline"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChangeText={(text) => {
                            setConfirmPassword(text);
                            setErrors(prev => ({ ...prev, confirmPassword: '' }));
                        }}
                        isPassword
                        showPassword={showConfirmPassword}
                        onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                        error={errors.confirmPassword}
                        touched={!!errors.confirmPassword}
                    />

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleResetPassword}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.btnText}>Reset Password</Text>
                        )}
                    </TouchableOpacity>

                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        marginTop: 20,
        marginBottom: 40,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitles: {
        gap: 8,
    },
    welcomeText: {
        fontSize: 32,
        fontWeight: "800",
        color: "#1a1a1a",
        letterSpacing: -0.5,
    },
    subtitleText: {
        fontSize: 16,
        color: "#666",
        lineHeight: 24,
    },
    formContainer: {
        flex: 1,
        gap: 20
    },
    btn: {
        backgroundColor: "#D0BB95",
        padding: 16,
        alignItems: "center",
        borderRadius: 12,
        marginTop: 20,
        shadowColor: "#D0BB95",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    btnDisabled: {
        opacity: 0.7,
    },
    btnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },
});
