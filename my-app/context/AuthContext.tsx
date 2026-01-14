import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { User, authAPI } from '../services/api';
import { storageService } from '../services/storage';
import { socketService, SocketStatus } from '../services/socketService';
import { notificationService } from '../services/notificationService';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    socketStatus: SocketStatus;
    login: (user: User) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [socketStatus, setSocketStatus] = useState<SocketStatus>('disconnected');

    // Load user from storage on mount
    useEffect(() => {
        loadUser();

        // Listen for socket status changes globally
        const unsubscribe = socketService.onStatusChange((status) => {
            setSocketStatus(status);
        });

        return unsubscribe;
    }, []);

    // GLOBAL NAVIGATION WATCHER
    // Automatically redirect to login if user becomes null
    useEffect(() => {
        if (!isLoading && !user) {
            console.log('🛰️ No user session detected, enforcing redirect to login...');
            // Need a slight timeout to ensure router is ready
            const timer = setTimeout(() => {
                const { router } = require('expo-router');
                try {
                    router.replace('/login');
                } catch (err) {
                    console.log('Navigation redirect failed (likely router not ready)');
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [user, isLoading]);

    const loadUser = async () => {
        try {
            const storedUser = await storageService.getUser();
            if (storedUser) {
                setUser(storedUser);
                // Connect socket if we have a user
                socketService.connect(storedUser._id, storedUser.userType === 'driver' ? 'driver' : 'user');
            }
        } catch (error) {
            console.error('Failed to load user', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = useCallback(async (userData: User) => {
        setUser(userData);
        await storageService.saveUser(userData);
        socketService.connect(userData._id, userData.userType === 'driver' ? 'driver' : 'user');
    }, []);

    const logout = useCallback(async () => {
        try {
            setIsLoading(true);
            await authAPI.logout();
        } catch (error) {
            console.error("Logout API error:", error);
            // Still proceed with local logout
        } finally {
            try {
                socketService.disconnect();
            } catch (err) {
                console.error("Socket disconnect error:", err);
            }
            setUser(null);
            setIsLoading(false);
        }
    }, []);

    // Listen for global logout events
    useEffect(() => {
        const logoutSubscription = DeviceEventEmitter.addListener('auth:logout', () => {
            console.log('🔄 Global logout triggered via event');
            logout();
        });
        return () => logoutSubscription.remove();
    }, [logout]);

    const updateUser = useCallback(async (updatedData: User) => {
        setUser(updatedData);
        await storageService.saveUser(updatedData);
    }, []);

    const refreshProfile = useCallback(async () => {
        if (!user?._id) return;
        try {
            const response = await authAPI.getUser(user._id);
            if (response.success && response.user) {
                await updateUser(response.user);
            }
        } catch (error: any) {
            console.error("Failed to refresh profile", error);
            // If user is deleted or not found, logout immediately to prevent loops
            if (error?.message === "User not found") {
                await logout();
            }
        }
    }, [user?._id, updateUser, logout]);

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            socketStatus,
            login,
            logout,
            updateUser,
            refreshProfile
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
