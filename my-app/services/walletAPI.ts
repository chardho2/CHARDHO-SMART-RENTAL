import api from './api';

// ... existing interfaces ...

// Wallet interfaces
export interface WalletBalance {
    totalBalance: number;
    availableBalance: number;
    lockedBalance: number;
    lifetimeEarnings: number;
    totalWithdrawn: number;
    currency: string;
    status: string;
}

export interface WalletBalanceResponse {
    success: boolean;
    balance: WalletBalance;
}

export interface WalletDetails extends WalletBalance {
    stats: {
        totalTransactions: number;
        totalCredits: number;
        totalDebits: number;
        averageTransactionAmount: number;
    };
    lastTransactionAt?: string;
}

export interface WalletDetailsResponse {
    success: boolean;
    wallet: WalletDetails;
}

export interface WalletTransaction {
    _id: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    status: 'pending' | 'completed' | 'failed';
    paymentMethod: string;
    createdAt: string;
    metadata?: any;
}

export interface WalletTransactionsResponse {
    success: boolean;
    transactions: WalletTransaction[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

export interface WalletStats {
    period: string;
    currentBalance: number;
    availableBalance: number;
    lockedBalance: number;
    lifetimeEarnings: number;
    totalWithdrawn: number;
    credits: {
        count: number;
        total: number;
    };
    debits: {
        count: number;
        total: number;
    };
}

export interface WalletStatsResponse {
    success: boolean;
    stats: WalletStats;
}

// Wallet API methods
export const walletAPI = {
    getBalance: async (): Promise<WalletBalanceResponse> => {
        const response = await api.get('/driver/wallet/balance');
        return response.data;
    },

    getDetails: async (): Promise<WalletDetailsResponse> => {
        const response = await api.get('/driver/wallet');
        return response.data;
    },

    getTransactions: async (params?: {
        page?: number;
        limit?: number;
        type?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<WalletTransactionsResponse> => {
        const response = await api.get('/driver/wallet/transactions', { params });
        return response.data;
    },

    getStats: async (period: 'today' | 'week' | 'month' | 'all' = 'all'): Promise<WalletStatsResponse> => {
        const response = await api.get('/driver/wallet/stats', { params: { period } });
        return response.data;
    },

    requestWithdrawal: async (amount: number) => {
        const response = await api.post('/driver/wallet/withdraw', { amount });
        return response.data;
    }
};
