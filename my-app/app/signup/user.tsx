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
    KeyboardAvoidingView
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

export default function UserSignup() {
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    // Form validation state
    const [errors, setErrors] = useState({ name: '', email: '', phone: '', password: '' });

    const validateForm = () => {
        let isValid = true;
        const newErrors = { name: '', email: '', phone: '', password: '' };

        if (!name.trim()) {
            newErrors.name = 'Full name is required';
            isValid = false;
        } else if (name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
            isValid = false;
        }

        if (!email.trim()) {
            newErrors.email = 'Email is required';
            isValid = false;
        } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
            newErrors.email = 'Please enter a valid email';
            isValid = false;
        }

        if (!phone.trim()) {
            newErrors.phone = 'Phone number is required';
            isValid = false;
        } else if (!/^[0-9]{10,15}$/.test(phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Phone must be 10-15 digits';
            isValid = false;
        }

        if (!password.trim()) {
            newErrors.password = 'Password is required';
            isValid = false;
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{5,15}$/.test(password)) {
            newErrors.password = 'Weak password: Need mixed case, numbers & symbols';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSignup = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const response = await authAPI.register({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim().replace(/\s/g, ''),
                password: password.trim(),
                userType: 'user'
            });

            if (response.success) {
                if (response.user) {
                    await login(response.user);
                }
                if (response.token) {
                    await storageService.saveToken(response.token);
                }

                if (Platform.OS === 'web') {
                    router.replace("/home" as any);
                } else {
                    Alert.alert(
                        "Success",
                        "Account created successfully!",
                        [
                            {
                                text: "OK",
                                onPress: () => router.replace("/home" as any)
                            }
                        ]
                    );
                }
            }
        } catch (error: any) {
            console.error("Registration error:", error);
            const msg = error?.message || "Registration failed. Please check your inputs.";
            Alert.alert("Registration Failed", msg);
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
                            <Text style={styles.welcomeText}>Create Account</Text>
                            <Text style={styles.subtitleText}>Join thousands of happy riders</Text>
                        </View>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formContainer}>
                        <AuthInput
                            icon="person-outline"
                            placeholder="Full Name"
                            value={name}
                            onChangeText={(text) => {
                                setName(text);
                                setErrors(prev => ({ ...prev, name: '' }));
                            }}
                            autoCapitalize="words"
                            error={errors.name}
                            touched={!!errors.name}
                        />

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
                            icon="call-outline"
                            placeholder="Phone Number"
                            value={phone}
                            onChangeText={(text) => {
                                setPhone(text);
                                setErrors(prev => ({ ...prev, phone: '' }));
                            }}
                            keyboardType="phone-pad"
                            error={errors.phone}
                            touched={!!errors.phone}
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
                        <Text style={styles.passwordHint}>
                            5-15 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol
                        </Text>

                        <AuthButton
                            title="Sign Up"
                            onPress={handleSignup}
                            loading={loading}
                            variant="primary"
                            style={styles.signupButton}
                        />

                        <View style={styles.divider}>
                            <View style={styles.line} />
                            <Text style={styles.dividerText}>or sign up with</Text>
                            <View style={styles.line} />
                        </View>

                        <GoogleButton userType="user" />

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.push("/login/user" as any)}>
                                <Text style={styles.loginText}>Login</Text>
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
        marginBottom: 32,
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
    passwordHint: {
        fontSize: 12,
        color: '#999',
        marginLeft: 16,
        marginTop: -8,
        marginBottom: 24,
    },
    signupButton: {
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
    loginText: {
        color: '#1a1a1a',
        fontWeight: '700',
        fontSize: 15,
    },
});
