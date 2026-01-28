import 'dotenv/config';

export default {
    expo: {
        name: "chardhogo",
        slug: "chardhogo",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/logo.png",
        scheme: "chardhogo",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        extra: {
            eas: {
                projectId: "5bcfb028-5c46-4700-b712-18728268dd3e"
            }
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.chardhogo.app"
        },
        android: {
            adaptiveIcon: {
                backgroundColor: "#E6F4FE",
                foregroundImage: "./assets/images/android-icon-foreground.png",
                backgroundImage: "./assets/images/android-icon-background.png",
                monochromeImage: "./assets/images/android-icon-monochrome.png"
            },
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false,
            config: {
                googleMaps: {
                    apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
                }
            },
            package: "com.chardhogo.app",
            versionCode: 1,
            permissions: ["WAKE_LOCK"],
            usesCleartextTraffic: true
        },
        web: {
            output: "static",
            favicon: "./assets/images/favicon.png"
        },
        plugins: [
            "expo-router",
            "expo-web-browser",

            [
                "expo-splash-screen",
                {
                    image: "./assets/images/splash-icon.png",
                    imageWidth: 200,
                    resizeMode: "contain",
                    backgroundColor: "#ffffff",
                    dark: {
                        backgroundColor: "#000000"
                    }
                }
            ],
            "expo-secure-store",
            "@react-native-google-signin/google-signin"
        ],
        experiments: {
            typedRoutes: true
        }
    }
};
