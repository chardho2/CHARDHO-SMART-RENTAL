import api, { ApiResponse } from './api';

export interface Transaction {
    _id: string;
    amount: number;
    type: 'earning' | 'payout' | 'bonus' | 'ride_earning';
    description: string;
    date: string;
    status: 'completed' | 'pending' | 'locked' | 'failed';
}

export interface BankDetails {
    accountNumber: string;
    ifscCode: string;
    accountHolderName: string;
    verificationStatus?: 'pending' | 'verified' | 'failed';
    beneficiaryId?: string;
}

export interface DriverProfile {
    _id: string;
    name: string;
    email: string;
    phone: string;
    profilePicture?: string;
    isOnline: boolean;
    vehicle?: {
        type: string;
        model: string;
        plateNumber: string;
        color: string;
        year: number;
    };
    rating: number;
    totalRides: number;
    totalEarnings: number;
    bankDetails?: BankDetails;
    documents?: {
        license: string;
        aadhar: string;
        vehicleRC: string;
    };
    isVerified: boolean;
}

export interface TransactionsResponse extends ApiResponse {
    transactions: Transaction[];
}

export interface BankDetailsResponse extends ApiResponse {
    bankDetails: BankDetails;
}

export interface ProfileResponse extends ApiResponse {
    driver: DriverProfile;
}

export interface DriverStats {
    todayEarnings: number;
    todayRides: number;
    rating: number;
}

export interface StatsResponse extends ApiResponse {
    stats: DriverStats;
}

export interface UnreadCountResponse extends ApiResponse {
    count: number;
}

export interface NotificationsResponse extends ApiResponse {
    notifications: any[];
    unreadCount: number;
    total?: number;
    page?: number;
    limit?: number;
}

export interface NotificationStatsResponse extends ApiResponse {
    stats: {
        total: number;
        unread: number;
        read: number;
        byCategory: Record<string, number>;
        byPriority: Record<string, number>;
    };
}

export interface DeleteNotificationResponse extends ApiResponse {
    unreadCount?: number;
}

export interface ClearNotificationsResponse extends ApiResponse {
    deletedCount: number;
}

export interface FinancialSummary {
    walletBalance: number;
    payoutEligibleBalance: number;
    lockedBalance: number;
    currency: string;
    minPayoutThreshold: number;
    nextPayoutEstimation: string; // ISO Date
    bankVerificationStatus: 'pending' | 'verified' | 'failed';
    recentTransactions: Transaction[];
}

export interface FinancialSummaryResponse extends ApiResponse {
    data: FinancialSummary;
}

export const driverAPI = {
    // Get financial summary
    getFinancialSummary: async (): Promise<FinancialSummaryResponse> => {
        const response = await api.get('/driver/financial/summary');
        return response.data;
    },

    // Get driver profile
    getProfile: async (): Promise<ProfileResponse> => {
        const response = await api.get('/driver/profile');
        return response.data;
    },

    // Update driver profile (generic)
    updateProfile: async (data: Partial<DriverProfile>): Promise<ApiResponse> => {
        const response = await api.put('/driver/profile', data);
        return response.data;
    },

    // Get transactions
    getTransactions: async (page: number = 1, limit: number = 20): Promise<TransactionsResponse> => {
        const response = await api.get('/driver/transactions', { params: { page, limit } });
        return response.data;
    },

    // Get bank details
    getBankDetails: async (): Promise<BankDetailsResponse> => {
        const response = await api.get('/driver/bank-details');
        return response.data;
    },

    // Update bank details
    updateBankDetails: async (details: BankDetails): Promise<ApiResponse> => {
        const response = await api.put('/driver/bank-details', details);
        return response.data;
    },

    // Verify bank details
    verifyBankDetails: async (): Promise<ApiResponse> => {
        const response = await api.post('/driver/bank-details/verify');
        return response.data;
    },

    // Get notifications
    getNotifications: async (page = 1, limit = 20): Promise<NotificationsResponse> => {
        const response = await api.get('/notifications', { params: { page, limit } });
        return response.data;
    },

    // Get notifications with filters
    getNotificationsFiltered: async (params: {
        page?: number;
        limit?: number;
        category?: string;
        priority?: string;
        unreadOnly?: boolean;
    }): Promise<NotificationsResponse> => {
        const response = await api.get('/notifications', { params });
        return response.data;
    },

    // Get unread notification count
    getUnreadNotificationCount: async (): Promise<UnreadCountResponse> => {
        const response = await api.get('/notifications/unread-count');
        return response.data;
    },

    // Mark notification as read
    markNotificationRead: async (id: string): Promise<ApiResponse> => {
        const response = await api.put(`/notifications/${id}/read`);
        return response.data;
    },

    // Mark all notifications as read
    markAllNotificationsRead: async (): Promise<ApiResponse> => {
        const response = await api.put('/notifications/read-all');
        return response.data;
    },

    // Delete a notification
    deleteNotification: async (id: string): Promise<DeleteNotificationResponse> => {
        const response = await api.delete(`/notifications/${id}`);
        return response.data;
    },

    // Clear all read notifications
    clearAllReadNotifications: async (): Promise<ClearNotificationsResponse> => {
        const response = await api.delete('/notifications/clear-all');
        return response.data;
    },

    // Get notification statistics
    getNotificationStats: async (): Promise<NotificationStatsResponse> => {
        const response = await api.get('/notifications/stats');
        return response.data;
    },

    // Get driver stats
    getStats: async (): Promise<StatsResponse> => {
        const response = await api.get('/driver/stats');
        return response.data;
    },

    // Update driver status
    updateStatus: async (status: 'online' | 'offline', retryCount = 0): Promise<ApiResponse> => {
        try {
            console.log(`🔄 Updating driver status to: ${status}`);

            // Verify token exists before making request
            const { storageService } = await import('./storage');
            const token = await storageService.getToken();

            if (!token) {
                console.error('❌ No auth token found in storage');
                throw new Error('Authentication token not found. Please login again.');
            }

            console.log('✅ Token exists, making request...');
            const response = await api.put('/driver/status', { status });
            console.log('✅ Status update successful:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Status update error:', error.response?.data || error.message);

            // Retry logic for network errors (max 2 retries)
            if (retryCount < 2 && (!error.response || error.response.status >= 500)) {
                console.log(`🔄 Retrying status update (attempt ${retryCount + 1})...`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
                return driverAPI.updateStatus(status, retryCount + 1);
            }

            throw error;
        }
    },
};

export default driverAPI;
