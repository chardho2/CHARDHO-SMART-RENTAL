import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useState } from "react";

interface Booking {
    id: string;
    passengerName: string;
    pickup: string;
    dropoff: string;
    fare: number;
}

interface DriverContextProps {
    isOnline: boolean;
    toggleOnline: () => void;

    currentBooking: Booking | null;
    acceptBooking: (booking: Booking) => void;
    clearBooking: () => void;

    location: { latitude: number; longitude: number } | null;
    setLocation: (coords: any) => void;
}

const DriverAppContext = createContext<DriverContextProps>(null as any);

export function DriverAppProvider({ children }: any) {
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
    const [location, setLocationState] = useState(null);

    const toggleOnline = async () => {
        const newStatus = !isOnline;
        setIsOnline(newStatus);
        await SecureStore.setItemAsync("driverOnline", JSON.stringify(newStatus));
    };

    const setLocation = (loc: any) => {
        setLocationState(loc);
    };

    const acceptBooking = (booking: Booking) => {
        setCurrentBooking(booking);
    };

    const clearBooking = () => setCurrentBooking(null);

    return (
        <DriverAppContext.Provider
            value={{
                isOnline,
                toggleOnline,
                currentBooking,
                acceptBooking,
                clearBooking,
                location,
                setLocation,
            }}
        >
            {children}
        </DriverAppContext.Provider>
    );
}

export function useDriverApp() {
    return useContext(DriverAppContext);
}
