import api, { ApiResponse } from './api';

export interface LocationData {
    id?: string | number;
    name: string;
    address: string;
    coordinates: {
        latitude: number;
        longitude: number;
    };
    lat?: number; // legacy support
    lng?: number; // legacy support
    city?: string;
}

export interface DriverInfo {
    id: string;
    name: string;
    rating: number;
    totalRides: number;
    vehicle: string;
    vehicleType: string;
    plate: string;
    distance: string;
    eta: string;
    hasLocation: boolean;
}

export interface EstimateResponse {
    success: boolean;
    distance: number;
    estimates: {
        id: string;
        name: string;
        icon: string;
        seats: number;
        price: number;
        time: string;
        fareBreakdown: {
            baseFare: number;
            distanceCharge: number;
            total: number;
            distance: number;
        };
    }[];
}

export interface BookingsResponse extends ApiResponse {
    bookings: any[]; // Using any[] for now as Trip interface is local to components usually
    pagination?: {
        total: number;
        page: number;
        limit: number;
        pages: number;
    };
}

// Booking API
export interface BookingDetailsResponse {
    success: boolean;
    booking: any;
    message?: string;
}

export const bookingAPI = {
    // Search locations
    searchLocations: async (
        query: string,
        latitude?: number,
        longitude?: number
    ): Promise<LocationData[]> => {
        const params: any = { query };
        if (latitude && longitude) {
            params.latitude = latitude;
            params.longitude = longitude;
        }
        const response = await api.get('/booking/locations/search', { params });
        return response.data;
    },

    // Get popular locations
    getPopularLocations: async (
        city: string = 'New Delhi',
        latitude?: number,
        longitude?: number
    ): Promise<LocationData[]> => {
        const params: any = { city };
        if (latitude && longitude) {
            params.latitude = latitude;
            params.longitude = longitude;
        }
        const response = await api.get('/booking/locations/popular', { params });
        return response.data;
    },

    // Get available drivers
    getAvailableDrivers: async (latitude: number, longitude: number, rideType?: string): Promise<DriverInfo[]> => {
        const response = await api.get('/booking/drivers/available', {
            params: { latitude, longitude, rideType }
        });
        return response.data;
    },

    // Estimate rates
    estimateRates: async (pickup: any, destination: any): Promise<EstimateResponse> => {
        console.log('📤 Calling estimateRates API');
        console.log('📍 Pickup:', JSON.stringify(pickup, null, 2));
        console.log('📍 Destination:', JSON.stringify(destination, null, 2));

        try {
            const response = await api.post('/booking/estimate-rates', { pickup, destination });
            console.log('✅ Estimate rates response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ Estimate rates error:', error);
            console.error('Error response:', error.response?.data);
            console.error('Error status:', error.response?.status);
            console.error('Error message:', error.message);
            throw error;
        }
    },

    // Create booking
    createBooking: async (bookingData: any): Promise<ApiResponse> => {
        const response = await api.post('/booking/create', bookingData);
        return response.data;
    },

    // Get user's bookings
    getMyBookings: async (status?: string, limit: number = 10, page: number = 1): Promise<BookingsResponse> => {
        const response = await api.get('/booking/my-bookings', {
            params: { status, limit, page }
        });
        return response.data;
    },

    // Get driver's bookings
    getDriverBookings: async (status?: string, limit: number = 10, page: number = 1): Promise<BookingsResponse> => {
        const response = await api.get('/booking/driver-bookings', {
            params: { status, limit, page }
        });
        return response.data;
    },

    // Get booking by ID
    getBooking: async (id: string): Promise<BookingDetailsResponse> => {
        const response = await api.get(`/booking/${id}`);
        return response.data;
    },

    // Driver accepts/rejects
    acceptBooking: async (id: string): Promise<ApiResponse> => {
        const response = await api.patch(`/booking/${id}/accept`);
        return response.data;
    },

    rejectBooking: async (id: string): Promise<ApiResponse> => {
        const response = await api.patch(`/booking/${id}/reject`);
        return response.data;
    },

    driverArrived: async (id: string): Promise<ApiResponse> => {
        const response = await api.patch(`/booking/${id}/arrived`);
        return response.data;
    },

    verifyPin: async (bookingId: string, pin: string): Promise<ApiResponse> => {
        const response = await api.post('/booking/verify-pin', { bookingId, pin });
        return response.data;
    },

    // Complete booking
    completeBooking: async (id: string, location?: any): Promise<ApiResponse> => {
        const response = await api.patch(`/booking/${id}/complete`, { location });
        return response.data;
    },

    // Get recent searches
    getRecentSearches: async (): Promise<LocationData[]> => {
        try {
            const response = await api.get('/booking/locations/recent');
            return response.data;
        } catch (error) {
            return [];
        }
    },

    // Save recent search
    saveRecentSearch: async (location: Omit<LocationData, 'id'>): Promise<ApiResponse> => {
        try {
            const response = await api.post('/booking/locations/save-recent', location);
            return response.data;
        } catch (error) {
            return { success: false, message: 'Failed to save' };
        }
    },

    // Rate driver
    rateDriver: async (bookingId: string, rating: number, feedback?: string): Promise<ApiResponse> => {
        const response = await api.post(`/booking/${bookingId}/rate`, { rating, feedback });
        return response.data;
    },

    // Cancel booking
    cancelBooking: async (id: string, reason: string): Promise<ApiResponse> => {
        const response = await api.post(`/booking/${id}/cancel`, { reason });
        return response.data;
    },
};

export default bookingAPI;
