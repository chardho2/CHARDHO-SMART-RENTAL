import { router } from "expo-router";
import { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Alert,
    Platform,
    KeyboardAvoidingView,
    Image
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import GoogleButton from "../../components/common/GoogleButton";
import { authAPI } from "../../services/api";
import { storageService } from "../../services/storage";
import { useAuth } from "../../context/AuthContext";
import { AuthInput } from "../../components/auth/AuthInput";
import { AuthButton } from "../../components/auth/AuthButton";

export default function UserLogin() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    // Form validation state
    const [errors, setErrors] = useState({ email: '', password: '' });

    const validateForm = () => {
        let isValid = true;
        const newErrors = { email: '', password: '' };

        if (!email.trim()) {
            newErrors.email = 'Email is required';
            isValid = false;
        } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            newErrors.email = 'Please enter a valid email';
            isValid = false;
        }

        if (!password.trim()) {
            newErrors.password = 'Password is required';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const response = await authAPI.login({
                email: email.trim().toLowerCase(),
                password: password.trim()
            });

            if (response.success && response.user) {
                if (response.user.userType === 'driver') {
                    Alert.alert("Account Type Mismatch", "This account is registered as a driver. Please use the driver login.");
                    return;
                }

                await login(response.user);
                if (response.token) {
                    await storageService.saveToken(response.token);
                }

                if (Platform.OS === 'web') {
                    router.replace("/home" as any);
                } else {
                    router.replace("/home" as any);
                }
            }
        } catch (error: any) {
            // Check if this is an OAuth account
            if (error?.isOAuthAccount) {
                console.log("OAuth account login attempt handled:", error.message);
                Alert.alert(
                    "Google Account Detected",
                    "This account was created with Google Sign-In. Please use the 'Continue with Google' button below to log in.",
                    [{ text: "OK", style: "default" }]
                );
            } else {
                console.error("Login error:", error);
                const msg = error?.message || "Login failed. Please check your credentials.";
                Alert.alert("Login Failed", msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Section */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
                        </TouchableOpacity>
                        <View style={styles.headerTitles}>
                            <Text style={styles.welcomeText}>Welcome Back!</Text>
                            <Text style={styles.subtitleText}>Login to continue your journey</Text>
                        </View>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formContainer}>
                        <AuthInput
                            icon="mail-outline"
                            placeholder="Email Address"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                setErrors(prev => ({ ...prev, email: '' }));
                            }}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            error={errors.email}
                            touched={!!errors.email}
                        />

                        <AuthInput
                            icon="lock-closed-outline"
                            placeholder="Password"
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

                        <TouchableOpacity
                            onPress={() => router.push({ pathname: "/login/forgot-password", params: { userType: 'user' } } as any)}
                            style={styles.forgotPassword}
                        >
                            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                        </TouchableOpacity>

                        <AuthButton
                            title="Login"
                            onPress={handleLogin}
                            loading={loading}
                            variant="primary"
                            style={styles.loginButton}
                        />

                        <View style={styles.divider}>
                            <View style={styles.line} />
                            <Text style={styles.dividerText}>or continue with</Text>
                            <View style={styles.line} />
                        </View>

                        <GoogleButton userType="user" />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => router.push("/signup/user" as any)}>
                                <Text style={styles.signUpText}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    keyboardView: {
        flex: 1,
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
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 32,
    },
    forgotPasswordText: {
        color: '#D0BB95',
        fontWeight: '600',
        fontSize: 14,
    },
    loginButton: {
        marginBottom: 32,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 32,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#EFEFEF',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#999',
        fontSize: 14,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32,
    },
    footerText: {
        color: '#666',
        fontSize: 15,
    },
    signUpText: {
        color: '#1a1a1a',
        fontWeight: '700',
        fontSize: 15,
    },
});
