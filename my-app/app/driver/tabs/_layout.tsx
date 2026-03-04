import React from "react";
import { Redirect } from "expo-router";
import { Tabs } from "expo-router/tabs";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSettings } from "../../../context/SettingsContext";
import { useAuth } from "../../../context/AuthContext";

export default function DriverTabsLayout() {
  const { colors, darkMode } = useSettings();
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Redirect href="/login" />;
  if (user.userType !== "driver") return <Redirect href="/(tabs)/home" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#4FD1C5',
        tabBarInactiveTintColor: colors.subText,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          href: "/driver/tabs/dashboard",
          title: "Dashboard",
          tabBarLabel: "Dashboard",
          tabBarIcon: ({ color, size }) => (<MaterialIcons name="dashboard" size={size} color={color} />),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          href: "/driver/tabs/earnings",
          title: "Earnings",
          tabBarLabel: "Earnings",
          tabBarIcon: ({ color, size }) => (<MaterialCommunityIcons name="wallet" size={size} color={color} />),
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          href: "/driver/tabs/trips",
          title: "Trips",
          tabBarLabel: "Trips",
          tabBarIcon: ({ color, size }) => (<MaterialIcons name="history" size={size} color={color} />),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: "/driver/tabs/profile",
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color, size }) => (<MaterialIcons name="person" size={size} color={color} />),
        }}
      />
    </Tabs>
  );
}
