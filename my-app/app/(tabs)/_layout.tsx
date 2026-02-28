import { useCallback } from "react";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Tabs, router, useFocusEffect } from "expo-router";
import { HapticTab } from "../../components/common/haptic-tab";
import { useSettings } from "../../context/SettingsContext";
import { useAuth } from "../../context/AuthContext";
import { socketService } from "../../services/socketService";

export default function TabsLayout() {
  const { colors, darkMode } = useSettings();
  const { user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      if (user?._id) {
        // Ensure we are connected as a user when viewing user tabs
        socketService.connect(user._id, 'user');
      }
    }, [user])
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60,
        },
        tabBarActiveTintColor: "#8b6f46", // Use a consistent theme color
        tabBarButton: HapticTab,
        tabBarInactiveTintColor: colors.subText
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ride"
        options={{
          title: "Ride",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car-sport" size={size} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            router.push("/booking" as any);
          },
        })}
      />

      <Tabs.Screen
        name="trips"
        options={{
          title: "My Trips",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="history" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Account",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

    </Tabs>
  );
}