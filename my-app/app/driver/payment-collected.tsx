import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { PaymentCollectedScreen } from '../../src/features/payment/screens/PaymentCollectedScreen';

export default function PaymentCollectedPage() {
    const { bookingData } = useLocalSearchParams<{ bookingData: string }>();
    const booking = bookingData ? JSON.parse(bookingData) : null;

    return <PaymentCollectedScreen booking={booking} />;
}
