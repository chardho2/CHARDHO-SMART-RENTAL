import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from './api';

const STORAGE_KEYS = {
    USER: '@chardhogo_user',
    TOKEN: '@chardhogo_token',
    REFRESH_TOKEN: '@chardhogo_refresh_token',
    DEVICE_ID: '@chardhogo_device_id',
};

// Simple UUID generator for device ID
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

export const storageService = {
    // Save user data
    saveUser: async (user: User): Promise<void> => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        } catch (error) {
            console.error('Error saving user:', error);
            throw new Error('Failed to save user data');
        }
    },

    // Get user data
    getUser: async (): Promise<User | null> => {
        try {
            const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error getting user:', error);
            return null;
        }
    },

    // Remove user data (logout)
    removeUser: async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem(STORAGE_KEYS.USER);
            await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
            await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        } catch (error) {
            console.error('Error removing user:', error);
            throw new Error('Failed to logout');
        }
    },

    // Check if user is logged in
    isLoggedIn: async (): Promise<boolean> => {
        try {
            const user = await storageService.getUser();
            return user !== null;
        } catch (error) {
            return false;
        }
    },

    // Save auth token
    saveToken: async (token: string): Promise<void> => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
        } catch (error) {
            console.error('Error saving token:', error);
            throw new Error('Failed to save token');
        }
    },

    // Get auth token
    getToken: async (): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
        } catch (error) {
            console.error('Error getting token:', error);
            return null;
        }
    },

    // Save refresh token
    saveRefreshToken: async (token: string): Promise<void> => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
        } catch (error) {
            console.error('Error saving refresh token:', error);
        }
    },

    // Get refresh token
    getRefreshToken: async (): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        } catch (error) {
            console.error('Error getting refresh token:', error);
            return null;
        }
    },

    // Get or Create Device ID
    getDeviceId: async (): Promise<string> => {
        try {
            let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
            if (!deviceId) {
                deviceId = generateUUID();
                await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
            }
            return deviceId;
        } catch (error) {
            console.error('Error getting device ID:', error);
            return 'unknown_device_' + Date.now();
        }
    },

    // Clear all storage
    clearAll: async (): Promise<void> => {
        try {
            // We usually want to keep DEVICE_ID even after logout/clear, but strict generic clear clears all.
            // For now, standard clear is fine.
            await AsyncStorage.clear();
        } catch (error) {
            console.error('Error clearing storage:', error);
            throw new Error('Failed to clear storage');
        }
    },
};

export default storageService;
