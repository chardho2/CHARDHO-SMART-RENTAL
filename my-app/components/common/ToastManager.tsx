import React, { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, Text, View, Platform, Dimensions } from 'react-native';
import Animated, {
    FadeInUp,
    FadeOutUp,
    Layout,
    SlideInUp,
    SlideOutUp
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { notificationService, NotificationType } from '../../services/notificationService';

const { width } = Dimensions.get('window');

interface Toast {
    id: string;
    message: string;
    type: NotificationType;
    title?: string;
    duration?: number;
}

const TOAST_ICONS: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
    success: 'checkmark-circle',
    error: 'alert-circle',
    info: 'information-circle',
    warning: 'warning',
};

const TOAST_COLORS: Record<NotificationType, readonly [string, string]> = {
    success: ['#4caf50', '#2e7d32'],
    error: ['#f44336', '#c62828'],
    info: ['#2196f3', '#1565c0'],
    warning: ['#ff9800', '#ef6c00'],
};

const ToastItem = ({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss(toast.id);
        }, toast.duration || 3000);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onDismiss]);

    return (
        <Animated.View
            layout={Layout.springify()}
            entering={SlideInUp.springify().damping(15)}
            exiting={FadeOutUp.duration(200)}
            style={styles.toastContainer}
        >
            <LinearGradient
                colors={TOAST_COLORS[toast.type]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.toastContent}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name={TOAST_ICONS[toast.type]} size={24} color="#fff" />
                </View>
                <View style={styles.textContainer}>
                    {toast.title && <Text style={styles.toastTitle}>{toast.title}</Text>}
                    <Text style={styles.toastMessage}>{toast.message}</Text>
                </View>
            </LinearGradient>
        </Animated.View>
    );
};

export const ToastManager = () => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const insets = useSafeAreaInsets();

    const addToast = useCallback((message: string, type: NotificationType, title?: string, duration: number = 3000) => {
        console.log('🔔 Toast triggered:', { message, type, title });
        const id = Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, message, type, title, duration }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    useEffect(() => {
        console.log('📱 ToastManager mounted, registering with notificationService');
        // Register this instance with the service
        notificationService.setToastRef({
            show: (message: string, type: NotificationType, title?: string) => {
                console.log('📨 Notification received by ToastManager:', { message, type, title });
                addToast(message, type, title);
            }
        });

        return () => {
            console.log('📱 ToastManager unmounting, cleaning up ref');
            // Cleanup ref on unmount
            notificationService.setToastRef(null);
        };
    }, [addToast]);

    return (
        <View style={[styles.container, { top: insets.top + 10 }]} pointerEvents="box-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 16,
        right: 16,
        zIndex: 9999,
        alignItems: 'center',
        gap: 10,
    },
    toastContainer: {
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        minHeight: 60,
    },
    iconContainer: {
        marginRight: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    toastTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    toastMessage: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
});
