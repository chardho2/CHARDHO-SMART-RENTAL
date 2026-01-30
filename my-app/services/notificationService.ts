import { Alert, Platform, ToastAndroid } from 'react-native';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

class NotificationService {
    private toastRef: any = null;

    setToastRef(ref: any) {
        this.toastRef = ref;
    }

    show(message: string, type: NotificationType = 'info', title?: string) {
        console.log('🔊 NotificationService.show called:', { message, type, title, hasToastRef: !!this.toastRef });

        if (this.toastRef) {
            console.log('✅ [Suppressed UI] Using ToastRef to show notification');
            // User requested to remove toasts
            // this.toastRef.show(message, type, title);
            return;
        }

        console.log('⚠️ [Suppressed UI] No ToastRef available, using fallback');
        // Fallback for when toast ref is not set (e.g., during startup or outside React tree context)
        // if (Platform.OS === 'android') {
        //     ToastAndroid.showWithGravity(
        //         message,
        //         ToastAndroid.LONG,
        //         ToastAndroid.BOTTOM
        //     );
        // } else if (Platform.OS === 'ios') {
        //     // Alert.alert(title || type.toUpperCase(), message);
        // } else {
        //     console.log(`[${type.toUpperCase()}] ${message}`);
        //     if (typeof window !== 'undefined') {
        //         // @ts-ignore
        //         // if (window.alert) window.alert(message);
        //     }
        // }
    }

    success(message: string, title: string = 'Success') {
        this.show(message, 'success', title);
    }

    error(message: string, title: string = 'Error') {
        this.show(message, 'error', title);
    }

    info(message: string, title: string = 'Info') {
        this.show(message, 'info', title);
    }

    warning(message: string, title: string = 'Warning') {
        this.show(message, 'warning', title);
    }

    confirm(title: string, message: string, onConfirm: () => void, onCancel?: () => void) {
        Alert.alert(
            title,
            message,
            [
                { text: 'Cancel', style: 'cancel', onPress: onCancel },
                { text: 'Confirm', style: 'default', onPress: onConfirm }
            ]
        );
    }
}

export const notificationService = new NotificationService();
