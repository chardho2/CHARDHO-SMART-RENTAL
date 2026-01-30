import api from './api';

export const userAPI = {
    // Get user profile
    getProfile: async () => {
        try {
            const response = await api.get('/user/profile');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get profile');
        }
    },

    // Update user profile
    updateProfile: async (data: { name?: string; phone?: string }) => {
        try {
            const response = await api.put('/user/profile', data);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update profile');
        }
    },

    // Get wallet balance
    getWallet: async () => {
        try {
            const response = await api.get('/user/wallet');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get wallet balance');
        }
    },

    // Add money to wallet
    addMoney: async (amount: number) => {
        try {
            const response = await api.post('/user/add-money', { amount });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to add money');
        }
    },

    // Get transactions
    getTransactions: async () => {
        try {
            const response = await api.get('/user/transactions');
            return response.data;
        } catch (error: any) {
            console.error(error);
            return { success: false, transactions: [] };
        }
    },

    // Update online/offline status (for drivers)
    updateStatus: async (isOnline: boolean, location?: { latitude: number; longitude: number }) => {
        try {
            const response = await api.put('/user/status', { isOnline, location });
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update status');
        }
    },

    // Update vehicle information (for drivers)
    updateVehicle: async (vehicleData: {
        type?: string;
        model?: string;
        plateNumber?: string;
        color?: string;
        year?: number;
    }) => {
        try {
            const response = await api.put('/user/vehicle', vehicleData);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update vehicle');
        }
    },

    // Delete account
    deleteAccount: async () => {
        try {
            const response = await api.delete('/user/account');
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete account');
        }
    },

    // Get notifications
    getNotifications: async (page = 1, limit = 20) => {
        try {
            const response = await api.get('/notifications', { params: { page, limit } });
            return response.data;
        } catch (error: any) {
            console.error('Fetch notifications error:', error);
            return { success: false, notifications: [] };
        }
    },

    // Mark notification as read
    markNotificationRead: async (id: string) => {
        try {
            const response = await api.put(`/notifications/${id}/read`);
            return response.data;
        } catch (error: any) {
            console.error('Mark notification read error:', error);
            return { success: false };
        }
    },

    // Mark all notifications as read
    markAllNotificationsRead: async () => {
        try {
            const response = await api.put('/notifications/read-all');
            return response.data;
        } catch (error: any) {
            console.error('Mark all read error:', error);
            return { success: false };
        }
    },

    // Get notifications with filters
    getNotificationsFiltered: async (params: {
        page?: number;
        limit?: number;
        category?: string;
        priority?: string;
        unreadOnly?: boolean;
    }) => {
        try {
            const response = await api.get('/notifications', { params });
            return response.data;
        } catch (error: any) {
            console.error('Fetch filtered notifications error:', error);
            return { success: false, notifications: [], pagination: {}, unreadCount: 0 };
        }
    },

    // Get unread notification count
    getUnreadNotificationCount: async () => {
        try {
            const response = await api.get('/notifications/unread-count');
            return response.data;
        } catch (error: any) {
            console.error('Get unread count error:', error);
            return { success: false, count: 0 };
        }
    },

    // Delete a notification
    deleteNotification: async (id: string) => {
        try {
            const response = await api.delete(`/notifications/${id}`);
            return response.data;
        } catch (error: any) {
            console.error('Delete notification error:', error);
            return { success: false };
        }
    },

    // Clear all read notifications
    clearAllReadNotifications: async () => {
        try {
            const response = await api.delete('/notifications/clear-all');
            return response.data;
        } catch (error: any) {
            console.error('Clear all notifications error:', error);
            return { success: false };
        }
    },

    // Get notification statistics
    getNotificationStats: async () => {
        try {
            const response = await api.get('/notifications/stats');
            return response.data;
        } catch (error: any) {
            console.error('Get notification stats error:', error);
            return { success: false, stats: {} };
        }
    },

    // Get emergency contacts
    getEmergencyContacts: async () => {
        try {
            const response = await api.get('/user/emergency-contacts');
            return response.data;
        } catch (error: any) {
            console.error('Get emergency contacts error:', error);
            return { success: false, contacts: [] };
        }
    },

    // Add emergency contact
    addEmergencyContact: async (data: { name: string; number: string; relation: string }) => {
        try {
            const response = await api.post('/user/emergency-contacts', data);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to add contact');
        }
    },

    // Delete emergency contact
    deleteEmergencyContact: async (id: string) => {
        try {
            const response = await api.delete(`/user/emergency-contacts/${id}`);
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to delete contact');
        }
    }
};
