import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { storageService } from './storage';
import { Platform, DeviceEventEmitter } from 'react-native';

// const getBaseUrl = () => {
//     // Use environment variable if set
//     if (process.env.EXPO_PUBLIC_API_URL) {
//         return process.env.EXPO_PUBLIC_API_URL;
//     }

//     // Android emulator
//     if (Platform.OS === "android") {
//         return "http://10.0.2.2:4000/api";
//     }

//     return "http://localhost:4000/api";

// };

import Constants from 'expo-constants';

export const getBaseUrl = () => {
    // 1. Prioritize Environment Variable
    if (process.env.EXPO_PUBLIC_API_URL) {
        console.log('Using API URL from env:', process.env.EXPO_PUBLIC_API_URL);
        return process.env.EXPO_PUBLIC_API_URL;
    }

    // 2. Dynamic IP detection for Expo Go
    const debuggerHost = Constants.expoConfig?.hostUri;
    const localhost = debuggerHost ? debuggerHost.split(':')[0] : 'localhost';

    let url;
    if (Platform.OS === "android") {
        // If on a physical device (debuggerHost exists), use that IP.
        // If on emulator (no debuggerHost usually, or if we want to fallback), use 10.0.2.2
        // NOTE: If using Expo on Emulator, debuggerHost MIGHT be the computer's LAN IP.
        // Accessing LAN IP from Emulator usually works, but 10.0.2.2 is safer for loopback.
        // However, we default to the LAN IP if available because it works for both Physical and Emulator (usually).
        url = debuggerHost ? `http://${localhost}:4000/api` : "http://10.0.2.2:4000/api";
    } else {
        url = `http://${localhost}:4000/api`;
    }

    // console.log('📍 Computed API Base URL:', url);
    return url;
};

const API_BASE_URL = getBaseUrl();
// console.log('🌐 API Base URL initialized:', API_BASE_URL);

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // Increased timeout
    withCredentials: true,
});

// Request Interceptor: Attach Token & Device ID
api.interceptors.request.use(
    async (config) => {
        const token = await storageService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle Token Refresh
interface RetryConfig extends AxiosRequestConfig {
    _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as RetryConfig;

        // If 401 or 403 and not already retried
        if ((error.response?.status === 401 || error.response?.status === 403) && originalRequest && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                })
                    .then(token => {
                        if (originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                        } else {
                            originalRequest.headers = { Authorization: `Bearer ${token}` };
                        }
                        return api(originalRequest);
                    })
                    .catch(err => {
                        return Promise.reject(err);
                    });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = await storageService.getRefreshToken();
                if (!refreshToken) {
                    // No refresh token available, logout user
                    isRefreshing = false;
                    await storageService.removeUser();
                    // Optional: Dispatch a logout event or navigation here if needed
                    return Promise.reject(error);
                }

                // Call refresh endpoint
                // Note: We use a separate axios instance to avoid infinite loops if this fails
                const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });

                if (response.data.success && response.data.token) {
                    const newToken = response.data.token;
                    await storageService.saveToken(newToken);

                    if (response.data.refreshToken) {
                        await storageService.saveRefreshToken(response.data.refreshToken);
                    }

                    // Process pending requests
                    processQueue(null, newToken);

                    // Update header and retry original request
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    } else {
                        originalRequest.headers = { Authorization: `Bearer ${newToken}` };
                    }

                    return api(originalRequest);
                } else {
                    // Refresh successful but no token returned (unlikely but handle it)
                    throw new Error('No token returned from refresh');
                }
            } catch (refreshError: any) {
                // If refresh fails (e.g. 403), logout user and reject all queues
                processQueue(refreshError, null);
                await storageService.removeUser();
                DeviceEventEmitter.emit('auth:logout');
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

// Types
export interface RegisterData {
    name: string;
    email: string;
    phone: string;
    password: string;
    userType?: 'user' | 'driver';
    vehicleNumber?: string;
    licenseNumber?: string;
    deviceId?: string;
    deviceName?: string;
}

export interface LoginData {
    email: string;
    password: string;
    deviceId?: string;
    deviceName?: string;
}

export interface User {
    _id: string;
    name: string;
    email: string;
    phone: string;
    userType: 'user' | 'driver';
    vehicleNumber?: string;
    licenseNumber?: string;
    isOnline?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    token?: string;
    refreshToken?: string;
    user?: User;
    booking?: any; // For booking responses
    data?: T;
    errors?: Record<string, string>;
}

// API Functions
export const authAPI = {
    // Helper to get device info
    getDeviceInfo: async () => {
        const deviceId = await storageService.getDeviceId();
        const deviceName = Platform.OS === 'web' ? 'Web Browser' : `${Platform.OS.toUpperCase()} Device`;
        return { deviceId, deviceName };
    },

    // Register a new user
    register: async (userData: RegisterData): Promise<ApiResponse> => {
        try {
            const { deviceId, deviceName } = await authAPI.getDeviceInfo();
            const response = await api.post('/auth/register', { ...userData, deviceId, deviceName });

            // Auto-save refresh token
            if (response.data.refreshToken) {
                await storageService.saveRefreshToken(response.data.refreshToken);
            }
            if (response.data.token) {
                await storageService.saveToken(response.data.token);
            }

            return response.data;
        } catch (error: any) {
            handleApiError(error);
            throw error;
        }
    },

    // Login user
    login: async (credentials: LoginData): Promise<ApiResponse> => {
        try {
            const { deviceId, deviceName } = await authAPI.getDeviceInfo();
            const response = await api.post('/auth/login', { ...credentials, deviceId, deviceName });

            if (response.data.refreshToken) {
                await storageService.saveRefreshToken(response.data.refreshToken);
            }
            if (response.data.token) {
                await storageService.saveToken(response.data.token);
            }

            return response.data;
        } catch (error: any) {
            handleApiError(error);
            throw error;
        }
    },

    // Get user by ID
    getUser: async (userId: string): Promise<ApiResponse> => {
        try {
            const response = await api.get(`/auth/user/${userId}`);
            return response.data;
        } catch (error: any) {
            handleApiError(error);
            throw error;
        }
    },



    // Logout
    logout: async (): Promise<ApiResponse> => {
        try {
            const refreshToken = await storageService.getRefreshToken();

            // 1. Clear local storage IMMEDIATELY for responsiveness
            await storageService.removeUser();

            // 2. Clear other common items
            try {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                await AsyncStorage.multiRemove([
                    "currentBookingId",
                    "pendingBooking",
                    "selectedDriver",
                    "activeRide"
                ]);
            } catch (storageErr) {
                console.warn('Silent storage cleanup error:', storageErr);
            }

            // 3. Inform server (non-blocking or handled separately)
            if (refreshToken) {
                // We DON'T await this to make the UI transition instant
                api.post('/auth/logout', { refreshToken }).catch(err => {
                    console.error('Server logout inform failed', err);
                });
            }

            return { success: true, message: 'Logged out' };
        } catch (error) {
            console.error('Logout failed:', error);
            return { success: true, message: 'Logged out locally' };
        }
    }
};

const handleApiError = (error: any) => {
    if (error.response) {
        throw error.response.data;
    } else if (error.request) {
        throw {
            success: false,
            message: `Network error. Could not connect to ${API_BASE_URL}. Please check your connection.`,
        };
    } else {
        throw {
            success: false,
            message: error.message || 'An unexpected error occurred',
        };
    }
};

export default api;
