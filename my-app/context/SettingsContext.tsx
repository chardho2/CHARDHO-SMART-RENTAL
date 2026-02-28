import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as NotificationsType from 'expo-notifications';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Safely load expo-notifications to avoid side-effect errors in Expo Go on Android (SDK 53+)
// We use a local variable to avoid naming conflicts with the type
let Notifications: typeof NotificationsType | null = null;
if (!isExpoGo || Platform.OS === 'ios') {
    try {
        // Use require to avoid top-level side effects of expo-notifications in Expo Go
        Notifications = require('expo-notifications');
    } catch (e) {
        console.error('Failed to load expo-notifications:', e);
    }
}

// Theme Colors
const lightTheme = {
    background: '#f7f7f6',
    card: '#ffffff',
    text: '#1a1a1a',
    subText: '#666666',
    border: '#f5f5f5',
    input: '#f5f5f5',
    icon: '#1a1a1a',
    primary: '#4FD1C5',
    danger: '#f44336',
};

const darkTheme = {
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    subText: '#AAAAAA',
    border: '#333333',
    input: '#2C2C2C',
    icon: '#FFFFFF',
    primary: '#4FD1C5',
    danger: '#ef5350',
};

interface SettingsContextType {
    notifications: boolean;
    darkMode: boolean;
    soundEnabled: boolean;
    language: string;
    colors: typeof lightTheme;
    toggleNotifications: (value: boolean) => Promise<void>;
    toggleDarkMode: (value: boolean) => Promise<void>;
    toggleSound: (value: boolean) => Promise<void>;
    setLanguage: (lang: string) => Promise<void>;
    clearCache: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [language, setLanguageState] = useState('English');

    // Derived state
    const colors = darkMode ? darkTheme : lightTheme;

    useEffect(() => {
        loadSettings();

        // Set up notification handler on app start
        if (Notifications) {
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: soundEnabled,
                    shouldSetBadge: false,
                    shouldShowBanner: true,
                    shouldShowList: true,
                }),
            });
        }
    }, [soundEnabled]);

    const loadSettings = async () => {
        try {
            const keys = ['settings_notifications', 'settings_darkMode', 'settings_sound', 'settings_language'];
            const result = await AsyncStorage.multiGet(keys);

            result.forEach(([key, value]) => {
                if (value !== null) {
                    switch (key) {
                        case 'settings_notifications': setNotifications(value === 'true'); break;
                        case 'settings_darkMode': setDarkMode(value === 'true'); break;
                        case 'settings_sound': setSoundEnabled(value === 'true'); break;
                        case 'settings_language': setLanguageState(value); break;
                    }
                }
            });
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const toggleNotifications = async (value: boolean) => {
        setNotifications(value);
        await AsyncStorage.setItem('settings_notifications', String(value));

        if (value) {
            if (!Notifications) {
                if (isExpoGo && Platform.OS === 'android') {
                    Alert.alert(
                        'Notification Limitation',
                        'Push notifications are not supported in Expo Go on Android (SDK 53+). Please use a development build for this feature.'
                    );
                }
                setNotifications(false);
                await AsyncStorage.setItem('settings_notifications', 'false');
                return;
            }

            // Request permissions and set up notifications
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Push notifications permission is required to receive notifications.');
                setNotifications(false);
                await AsyncStorage.setItem('settings_notifications', 'false');
                return;
            }

            // Configure notification handler
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: soundEnabled,
                    shouldSetBadge: false,
                    shouldShowBanner: true,
                    shouldShowList: true,
                }),
            });
        }
    };

    const toggleDarkMode = async (value: boolean) => {
        setDarkMode(value);
        await AsyncStorage.setItem('settings_darkMode', String(value));
    };

    const toggleSound = async (value: boolean) => {
        setSoundEnabled(value);
        await AsyncStorage.setItem('settings_sound', String(value));

        // Update notification handler if notifications are enabled
        if (notifications && Notifications) {
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: value,
                    shouldSetBadge: false,
                    shouldShowBanner: true,
                    shouldShowList: true,
                }),
            });
        }
    };

    const setLanguage = async (lang: string) => {
        setLanguageState(lang);
        await AsyncStorage.setItem('settings_language', lang);
    };

    const clearCache = async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const keysToRemove = keys.filter(k => !k.startsWith('auth') && !k.startsWith('settings'));
            if (keysToRemove.length > 0) {
                await AsyncStorage.multiRemove(keysToRemove);
            }
            Alert.alert('Success', 'Cache cleared successfully.');
        } catch (error) {
            console.error('Error clearing cache:', error);
            Alert.alert('Error', 'Failed to clear cache.');
        }
    };

    return (
        <SettingsContext.Provider value={{
            notifications,
            darkMode,
            soundEnabled,
            language,
            colors,
            toggleNotifications,
            toggleDarkMode,
            toggleSound,
            setLanguage,
            clearCache
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
