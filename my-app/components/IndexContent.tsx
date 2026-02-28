import { useEffect, useState } from "react";
import { View, StyleSheet, Image, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function IndexContent() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Minimum splash screen time
        const timer = setTimeout(() => {
            setIsReady(true);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (isReady && !isLoading) {
            if (user) {
                // If user is already logged in, go to their respective dashboard
                if (user.userType === 'driver') {
                    router.replace('/driver/tabs/dashboard');
                } else {
                    router.replace('/(tabs)/home');
                }
            } else {
                // If no user, go to login
                router.replace('/login');
            }
        }
    }, [isReady, isLoading, user, router]);

    return (
        <View style={styles.container}>
            <Image
                source={require("../assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
        justifyContent: "center",
        alignItems: "center",
    },
    logo: {
        width: Dimensions.get("window").width * 0.8,
        height: 300,
    },
});
