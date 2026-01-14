import { Stack } from "expo-router";
import { useSettings } from "../../context/SettingsContext";

export default function AccountLayout() {
    const { colors } = useSettings();

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.background },
            }}
        >
            <Stack.Screen name="settings" options={{ title: "Settings" }} />
            <Stack.Screen name="wallet" options={{ title: "Wallet" }} />
            <Stack.Screen name="support" options={{ title: "Support" }} />
            <Stack.Screen name="sos" options={{ title: "SOS Emergency" }} />
            <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
        </Stack>
    );
}