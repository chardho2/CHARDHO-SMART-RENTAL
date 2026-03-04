import { bookingAPI } from '../../../../services/bookingAPI';
import { storageService } from '../../../../services/storage';

// Define types for better safety
export interface PaymentStatusResponse {
    success: boolean;
    message?: string;
    booking?: any;
}

export const PaymentService = {
    /**
     * Verify the payment status of a booking
     * @param bookingId The ID of the booking to verify
     */
    verifyOnlinePayment: async (bookingId: string): Promise<PaymentStatusResponse> => {
        try {
            const response = await bookingAPI.getBooking(bookingId);
            return response;
        } catch (error: any) {
            throw new Error(error.message || 'Failed to verify payment');
        }
    },

    /**
     * Switch payment method to cash
     * @param bookingId The ID of the booking
     */
    switchToCash: async (bookingId: string): Promise<PaymentStatusResponse> => {
        try {
            const token = await storageService.getToken();
            const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

            const response = await fetch(`${apiUrl}/booking/${bookingId}/switch-to-cash`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            const data = await response.json();
            return data;
        } catch (error: any) {
            throw new Error(error.message || "Failed to switch to cash payment");
        }
    }
};
