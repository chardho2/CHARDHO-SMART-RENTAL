import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import { Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from "react-native";
import { authAPI } from '../../services/api';
import { storageService } from '../../services/storage';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

// IMPORTANT: Ensure these are defined in your .env file with EXPO_PUBLIC_ prefix
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_IOS_CLIENT_ID;
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_WEB_CLIENT_ID;

interface GoogleButtonProps {
    userType?: 'user' | 'driver';
    onPress?: () => void; // Optional override
}

export default function GoogleButton({ userType = 'user', onPress }: GoogleButtonProps) {


    // ⚠️ Check if Google Client IDs are configured
    const isConfigured = ANDROID_CLIENT_ID || IOS_CLIENT_ID || WEB_CLIENT_ID;

    React.useEffect(() => {
        const checkEnvironment = () => {
            const isExpoGo = Constants.appOwnership === 'expo';
            console.log("📱 Environment Check:");
            console.log("   - App Ownership:", Constants.appOwnership);
            console.log("   - Package Name:", Constants.expoConfig?.android?.package || "N/A");
            console.log("   - Scheme:", Constants.expoConfig?.scheme);

            if (isExpoGo && !WEB_CLIENT_ID) {
                Alert.alert(
                    "Setup Guide",
                    "detected you are using Expo Go. For this to work on Android, you MUST set the EXPO_PUBLIC_WEB_CLIENT_ID in your .env file, not just the Android one."
                );
            }
        };
        checkEnvironment();
    }, []);

    // If not configured, show disabled button
    if (!isConfigured) {

        return (
            <TouchableOpacity
                style={[styles.button, { opacity: 0.5 }]}
                disabled={true}
            >
                <View style={styles.row}>
                    <Image
                        source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" }}
                        style={styles.icon}
                    />
                    <Text style={styles.text}>Google Sign-In (Not Configured)</Text>
                </View>
            </TouchableOpacity>
        );
    }

    const redirectUri = makeRedirectUri({
        scheme: 'chardhogo',
        path: 'auth',
    });

    // Detect if we are using a blocked Local IP
    const isLocalIP = redirectUri.includes('192.168.') || redirectUri.includes('10.0.') || redirectUri.includes('172.');

    // Add debugging logs
    React.useEffect(() => {
        if (isLocalIP) {
            console.warn("⚠️ GOOGLE SIGN-IN WARNING: Google blocks local IP addresses (192.168...).");
            console.warn("👉 SOLUTION: Run 'npx expo start --tunnel' to get a public URL.");
        }
    }, [redirectUri]);

    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: ANDROID_CLIENT_ID,
        iosClientId: IOS_CLIENT_ID,
        webClientId: WEB_CLIENT_ID,
        scopes: ['profile', 'email'],
        redirectUri: redirectUri,
    });

    const [loading, setLoading] = React.useState(false);
    const { login } = useAuth();

    React.useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            if (authentication?.accessToken) {
                handleGoogleLogin(authentication.accessToken);
            }
        } else if (response?.type === 'error') {
            Alert.alert("Google Sign-In Error", "An error occurred during sign in");
        }
    }, [response]);

    // Check for placeholder values (Logged only)
    React.useEffect(() => {
        const checkPlaceholders = () => {
            if (ANDROID_CLIENT_ID?.includes('your_android_client_id') ||
                WEB_CLIENT_ID?.includes('your_web_client_id')) {
                console.warn("⚠️ Placeholder Client IDs detected in .env. Please update them.");
            }
        };
        checkPlaceholders();
    }, []);



    React.useEffect(() => {
        if (request) {
            console.log("Google Auth Request Redirect URI:", request.redirectUri);
            console.log("Google Auth Request Scopes:", request.scopes);
            console.log("Client IDs Status:", {
                android: !!ANDROID_CLIENT_ID,
                ios: !!IOS_CLIENT_ID,
                web: !!WEB_CLIENT_ID
            });
        }
    }, [request]);




    const handleGoogleLogin = async (token: string) => {
        setLoading(true);
        try {
            // Call backend to verify token and login/register
            const apiRes = await authAPI.googleLogin(token, userType);

            if (apiRes.success && apiRes.user) {
                // Save user and navigate
                await login(apiRes.user);
                // Save auth token
                if (apiRes.token) {
                    await storageService.saveToken(apiRes.token);
                }

                if (apiRes.user.userType === 'driver') {
                    router.replace("/driver/tabs/dashboard" as any);
                } else {
                    router.replace("/home" as any);
                }
            }
        } catch (e: any) {
            console.error("Google Login API Error:", e);
            let msg = e.message || "Failed to login with Google";
            // Simplify error message for user
            if (msg.includes("400")) msg = "Invalid Google Request";
            Alert.alert("Google Login Failed", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ width: '100%', alignItems: 'center' }}>
            <TouchableOpacity
                style={styles.button}
                onPress={() => {
                    if (onPress) {
                        onPress();
                    } else {
                        promptAsync();
                    }
                }}
                disabled={!request || loading}
            >
                <View style={styles.row}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#444" />
                    ) : (
                        <>
                            <Image
                                source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" }}
                                style={styles.icon}
                            />
                            <Text style={styles.text}>Continue with Google</Text>
                        </>
                    )}
                </View>
            </TouchableOpacity>
            {/* Debug Info for User */}
            {request && (
                <View style={{ marginTop: 10, alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: '#999', textAlign: 'center' }}>
                        Redirect URI: {request.redirectUri}
                    </Text>
                    {request.redirectUri.includes('192.168') && (
                        <Text style={{ fontSize: 11, color: 'red', marginTop: 5, textAlign: 'center', fontWeight: 'bold' }}>
                            ⚠️ Google blocks Local IPs (192.168...).{'\n'}
                            Please restart Expo with:{'\n'}
                            npx expo start --tunnel
                        </Text>
                    )}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: "#fff",
        borderRadius: 10,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: "#ddd",
        marginTop: 10,
        width: '100%',
    },
    row: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
    },
    icon: {
        width: 20,
        height: 20,
    },
    text: {
        fontSize: 15,
        color: "#444",
        fontWeight: "600",
    },
});

