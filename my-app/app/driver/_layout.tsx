import { Drawer } from "expo-router/drawer";
import DriverDrawer from "../../components/driver/DriverDrawer";
import { DriverAppProvider } from "../../context/DriverAppContext";

export default function DriverLayout() {
    return (
        <DriverAppProvider>
            <Drawer
                screenOptions={{ headerShown: false }}
                drawerContent={() => <DriverDrawer />}
            >
                <Drawer.Screen
                    name="tabs"
                    options={{
                        drawerLabel: "Dashboard",
                        headerShown: false,
                    }}
                />
                <Drawer.Screen
                    name="help"
                    options={{
                        drawerLabel: "Help & Support",
                        headerShown: false,
                    }}
                />
                <Drawer.Screen
                    name="settings"
                    options={{
                        drawerLabel: "Settings",
                        headerShown: false,
                    }}
                />
                <Drawer.Screen
                    name="bank-details"
                    options={{
                        drawerLabel: "Bank Details",
                        headerShown: false,
                    }}
                />
                <Drawer.Screen
                    name="documents"
                    options={{
                        drawerLabel: "Documents",
                        headerShown: false,
                    }}
                />
                <Drawer.Screen
                    name="edit-profile"
                    options={{
                        drawerLabel: "Edit Profile",
                        headerShown: false,
                    }}
                />
                <Drawer.Screen
                    name="edit-vehicle"
                    options={{
                        drawerLabel: "Edit Vehicle",
                        headerShown: false,
                    }}
                />
                <Drawer.Screen
                    name="notifications"
                    options={{
                        drawerLabel: "Notifications",
                        headerShown: false,
                    }}
                />
                <Drawer.Screen
                    name="current-trip"
                    options={{
                        drawerLabel: "Current Trip",
                        headerShown: false,
                    }}
                />
                <Drawer.Screen
                    name="wallet"
                    options={{
                        drawerLabel: "Wallet",
                        headerShown: false,
                    }}
                />
                <Drawer.Screen
                    name="trip-request"
                    options={{
                        drawerLabel: "Trip Request",
                        headerShown: false,
                    }}
                />
            </Drawer>
        </DriverAppProvider>
    );
}
