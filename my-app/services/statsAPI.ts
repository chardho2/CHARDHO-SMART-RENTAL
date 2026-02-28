import api from './api';

// Stats API Service
export const statsAPI = {
    // Get user statistics
    getUserStats: async () => {
        try {
            const response = await api.get('/stats/user');
            return response.data;
        } catch (error: any) {
            if (error.response) {
                throw error.response.data;
            } else if (error.request) {
                throw {
                    success: false,
                    message: 'Network error. Please check your connection.',
                };
            } else {
                throw {
                    success: false,
                    message: error.message || 'An unexpected error occurred',
                };
            }
        }
    },

    // Get driver statistics
    getDriverStats: async () => {
        try {
            const response = await api.get('/stats/driver');
            return response.data;
        } catch (error: any) {
            if (error.response) {
                throw error.response.data;
            } else if (error.request) {
                throw {
                    success: false,
                    message: 'Network error. Please check your connection.',
                };
            } else {
                throw {
                    success: false,
                    message: error.message || 'An unexpected error occurred',
                };
            }
        }
    },
};

export default statsAPI;
