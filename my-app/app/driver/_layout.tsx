import React from 'react';
import { Stack } from 'expo-router';
import { DriverAppProvider } from "../../context/DriverAppContext";

export default function DriverLayout() {
    return (
        <DriverAppProvider>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="tabs" />
                <Stack.Screen name="current-trip" />
                <Stack.Screen name="trip-request" />
            </Stack>
        </DriverAppProvider>
    );
}


