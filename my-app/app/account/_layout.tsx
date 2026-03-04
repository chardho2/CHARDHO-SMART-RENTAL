import { Redirect, Stack } from "expo-router";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../context/AuthContext";

export default function AccountLayout() {
    const { colors } = useSettings();
    const { user, isLoading } = useAuth();

    if (isLoading) return null;
    if (!user) return <Redirect href="/login" />;

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
