import 'dotenv/config';

export default {
    expo: {
        name: "Chardhogo",
        slug: "chardhogo",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/logo.png",
        scheme: "chardhogo",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,

        // REQUIRED: Store listing description
        description: "Book reliable taxi rides instantly with Chardhogo - your trusted ride-hailing service",

        // REQUIRED: Privacy policy
        privacy: "public",

        splash: {
            image: "./assets/images/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },

        // REQUIRED: OTA Updates configuration
        updates: {
            fallbackToCacheTimeout: 0,
            url: "https://u.expo.dev/5bcfb028-5c46-4700-b712-18728268dd3e"
        },

        extra: {
            eas: {
                projectId: "5bcfb028-5c46-4700-b712-18728268dd3e"
            }
        },

        // iOS Configuration
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.chardhogo.app",
            buildNumber: "1",

            // REQUIRED: Location permission strings
            infoPlist: {
                NSLocationWhenInUseUsageDescription: "Chardhogo needs your location to show nearby drivers and calculate ride fares.",
                NSLocationAlwaysAndWhenInUseUsageDescription: "Chardhogo needs your location to track your ride in real-time and ensure driver safety.",
                NSLocationAlwaysUsageDescription: "Chardhogo needs background location access to track your active ride.",
                NSCameraUsageDescription: "Chardhogo needs camera access to upload profile pictures and verify documents.",
                NSPhotoLibraryUsageDescription: "Chardhogo needs photo library access to upload profile pictures.",
                NSMicrophoneUsageDescription: "Chardhogo may use microphone for customer support calls.",
                NSUserTrackingUsageDescription: "This allows us to provide personalized ride recommendations and improve your experience."
            },

            // REQUIRED for Google Sign-In
            googleServicesFile: "./google-services/GoogleService-Info.plist"
        },

        // Android Configuration
        android: {
            adaptiveIcon: {
                backgroundColor: "#E6F4FE",
                foregroundImage: "./assets/images/android-icon-foreground.png",
                backgroundImage: "./assets/images/android-icon-background.png",
                monochromeImage: "./assets/images/android-icon-monochrome.png"
            },

            package: "com.chardhogo.app",
            versionCode: 1,

            // REQUIRED: Google Services for Auth, Maps, FCM
            googleServicesFile: "./google-services/google-services.json",

            // Android 12+ Splash Screen
            splash: {
                image: "./assets/images/splash-icon.png",
                resizeMode: "contain",
                backgroundColor: "#ffffff",
                dark: {
                    image: "./assets/images/splash-icon.png",
                    resizeMode: "contain",
                    backgroundColor: "#000000"
                }
            },

            // REQUIRED: Explicit permissions
            permissions: [
                "ACCESS_COARSE_LOCATION",
                "ACCESS_FINE_LOCATION",
                "ACCESS_BACKGROUND_LOCATION",
                "FOREGROUND_SERVICE",
                "FOREGROUND_SERVICE_LOCATION",
                "POST_NOTIFICATIONS",
                "WAKE_LOCK",
                "INTERNET",
                "ACCESS_NETWORK_STATE",
                "VIBRATE"
            ],

            // Google Maps API Key
            config: {
                googleMaps: {
                    apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
                }
            },

            // SECURITY: Set to false for production
            usesCleartextTraffic: false,

            // Android 10+ edge-to-edge
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false
        },

        // Web Configuration
        web: {
            output: "static",
            favicon: "./assets/images/favicon.png"
        },

        // REQUIRED: Plugins in correct order
        plugins: [
            "expo-router",

            // Location tracking (CRITICAL for taxi app)
            [
                "expo-location",
                {
                    locationAlwaysAndWhenInUsePermission: "Chardhogo needs your location to show nearby drivers and calculate ride fares.",
                    locationAlwaysPermission: "Chardhogo needs background location access to track your active ride.",
                    locationWhenInUsePermission: "Chardhogo needs your location to show nearby drivers and calculate ride fares.",
                    isAndroidBackgroundLocationEnabled: true,
                    isIosBackgroundLocationEnabled: true
                }
            ],

            // Push Notifications
            [
                "expo-notifications",
                {
                    icon: "./assets/images/notification-icon.png",
                    color: "#E6F4FE",
                    mode: "production"
                }
            ],

            // Splash Screen
            [
                "expo-splash-screen",
                {
                    image: "./assets/images/splash-icon.png",
                    imageWidth: 200,
                    resizeMode: "contain",
                    backgroundColor: "#ffffff",
                    dark: {
                        image: "./assets/images/splash-icon.png",
                        imageWidth: 200,
                        resizeMode: "contain",
                        backgroundColor: "#000000"
                    }
                }
            ],

            // Build Properties (Android/iOS native config)
            [
                "expo-build-properties",
                {
                    android: {
                        compileSdkVersion: 34,
                        targetSdkVersion: 34,
                        buildToolsVersion: "34.0.0",
                        kotlinVersion: "1.9.22",
                        enableProguardInReleaseBuilds: true,
                        enableShrinkResourcesInReleaseBuilds: true
                    },
                    ios: {
                        deploymentTarget: "15.1"
                    }
                }
            ],

            "expo-secure-store",
            "expo-web-browser",
            "@react-native-google-signin/google-signin"
        ],

        experiments: {
            typedRoutes: true
        },

        // REQUIRED: Runtime version for OTA updates
        runtimeVersion: {
            policy: "appVersion"
        }
    }
};
