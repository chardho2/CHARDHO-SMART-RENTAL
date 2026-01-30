import { Ionicons } from "@expo/vector-icons";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import Header from "../../components/layout/Header";
import { router } from "expo-router";
import { useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from '@react-navigation/native';

import * as Location from "expo-location";

const { width } = Dimensions.get("window");

const RIDE_OPTIONS = [
  { id: 'bike', title: 'Bike', price: '₹20-50', time: 'Quick', icon: 'bicycle', badge: 'Fastest', badgeIcon: 'flash' },
  { id: 'auto', title: 'Auto', price: '₹30-80', time: 'Popular', icon: 'car-outline', badge: 'Popular', badgeIcon: 'star' },
  { id: 'car', title: 'Car', price: '₹50-150', time: 'Comfort', icon: 'car-sport', badge: 'Comfort', badgeIcon: 'shield-checkmark' },
  { id: 'suv', title: 'SUV', price: '₹100-250', time: 'Premium', icon: 'car', badge: 'Spacious', badgeIcon: 'people' },
];

import { useSettings } from "../../context/SettingsContext";

export default function Home() {
  const { colors, darkMode } = useSettings();
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [hasActiveRide, setHasActiveRide] = useState(false);

  const dynamicStyles = {
    page: { backgroundColor: colors.background },
    card: { backgroundColor: colors.card, borderColor: colors.border },
    text: { color: colors.text },
    subText: { color: colors.subText },
    border: { borderColor: colors.border },
    iconBg: { backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(79, 209, 197, 0.15)' }
  };

  useFocusEffect(
    useCallback(() => {
      checkActiveRide();
    }, [])
  );

  const checkActiveRide = async () => {
    try {
      const bookingId = await AsyncStorage.getItem('currentBookingId');
      setHasActiveRide(!!bookingId);
    } catch (error) {
      console.error('Error checking active ride:', error);
    }
  };

  const handleSearchClick = async () => {
    try {
      setIsLoadingLocation(true);

      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required to book a ride. Please enable it in settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        setIsLoadingLocation(false);
        return;
      }

      // Get current location
      let location = null;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (posError) {
        console.warn("Home location fetch failed, trying last known position", posError);
        location = await Location.getLastKnownPositionAsync({});
      }

      if (!location) {
        throw new Error("Could not determine your location. Please select it manually.");
      }

      // Navigate to booking page - the booking page will handle setting pickup location
      // and automatically open the destination search modal
      router.push("/booking" as any);

    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Failed to get your location. You can still book a ride by selecting your pickup location manually.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => router.push("/booking" as any) }
        ]
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  return (
    <>
      <StatusBar barStyle={darkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} />
      <ScrollView style={[styles.page, dynamicStyles.page]} showsVerticalScrollIndicator={false}>
        <Header hasActiveRide={hasActiveRide} />

        {/* HERO SECTION WITH GRADIENT */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={['#0F2027', '#203A43', '#2C5364']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroTextContainer}>
                <Text style={styles.heroTitle}>
                  Your City,{"\n"}Your Ride.{" "}
                  <Text style={styles.heroHighlight}>Instantly.</Text>
                </Text>
                <Text style={styles.heroSubtitle}>
                  Experience premium ride-sharing with comfort and style
                </Text>
              </View>

              {/* SEARCH BAR */}
              <TouchableOpacity
                style={styles.searchContainer}
                onPress={handleSearchClick}
                activeOpacity={0.9}
                disabled={isLoadingLocation}
              >
                <View style={[styles.searchInputWrapper, dynamicStyles.card, dynamicStyles.border]}>
                  <View style={[styles.searchIconContainer, dynamicStyles.iconBg]}>
                    {isLoadingLocation ? (
                      <ActivityIndicator size="small" color="#4FD1C5" />
                    ) : (
                      <Ionicons name="location" size={22} color="#4FD1C5" />
                    )}
                  </View>
                  <View style={styles.searchTextContainer}>
                    <Text style={[styles.searchLabel, dynamicStyles.subText]}>Where to?</Text>
                    <Text style={[styles.searchPlaceholder, dynamicStyles.text]}>
                      {isLoadingLocation ? "Getting your location..." : "Search destination"}
                    </Text>
                  </View>
                  <View style={styles.searchBtn}>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>

              {/* QUICK ACTIONS */}
              <View style={styles.quickActions}>
                <TouchableOpacity style={[styles.quickActionBtn, dynamicStyles.card, dynamicStyles.border]} activeOpacity={0.7}>
                  <View style={[styles.quickActionIconBg, dynamicStyles.iconBg]}>
                    <Ionicons name="time" size={20} color="#4FD1C5" />
                  </View>
                  <Text style={[styles.quickActionText, dynamicStyles.text]}>Schedule</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickActionBtn, styles.quickActionBtnPrimary]}
                  onPress={() => router.push("/booking" as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.quickActionIconBg, styles.quickActionIconBgPrimary]}>
                    <Ionicons name="car-sport" size={20} color="#fff" />
                  </View>
                  <Text style={[styles.quickActionText, styles.quickActionTextPrimary]}>Ride Now</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.quickActionBtn, dynamicStyles.card, dynamicStyles.border]} activeOpacity={0.7}>
                  <View style={[styles.quickActionIconBg, dynamicStyles.iconBg]}>
                    <Ionicons name="gift" size={20} color="#4FD1C5" />
                  </View>
                  <Text style={[styles.quickActionText, dynamicStyles.text]}>Offers</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.container}>
          {/* RIDE OPTIONS */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, dynamicStyles.text]}>Choose Your Ride</Text>
              <Text style={[styles.sectionDesc, dynamicStyles.subText]}>
                Select the perfect vehicle for your journey
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rideOptionsScroll}
            >
              {RIDE_OPTIONS.map((ride) => (
                <TouchableOpacity
                  key={ride.id}
                  style={[styles.rideOption, dynamicStyles.card, dynamicStyles.border]}
                  onPress={() => router.push("/booking" as any)}
                  activeOpacity={0.8}
                >
                  <View style={styles.rideIconBg}>
                    <Ionicons name={ride.icon as any} size={32} color="#667eea" />
                  </View>
                  <View style={styles.rideOptionContent}>
                    <Text style={[styles.rideOptionTitle, dynamicStyles.text]}>{ride.title}</Text>
                    <Text style={styles.rideOptionPrice}>{ride.price}</Text>
                    <View style={styles.rideOptionBadge}>
                      <Ionicons name={ride.badgeIcon as any} size={12} color="#667eea" />
                      <Text style={styles.rideOptionBadgeText}>{ride.badge}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* PROMO BANNER */}
          <TouchableOpacity style={styles.promoBanner} activeOpacity={0.9}>
            <LinearGradient
              colors={['#667eea', '#764ba2', '#f093fb']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.promoGradient}
            >
              <View style={styles.promoContent}>
                <View style={styles.promoTextContainer}>
                  <View style={styles.promoTag}>
                    <Ionicons name="gift" size={14} color="#fff" />
                    <Text style={styles.promoTagText}>LIMITED OFFER</Text>
                  </View>
                  <Text style={styles.promoTitle}>First Ride Free!</Text>
                  <Text style={styles.promoDesc}>Use code: WELCOME50</Text>
                </View>
                <View style={styles.promoIconContainer}>
                  <Ionicons name="arrow-forward-circle" size={48} color="#fff" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* FEATURES SECTION */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, dynamicStyles.text]}>Everything You Need</Text>
              <Text style={[styles.sectionDesc, dynamicStyles.subText]}>
                Discover smarter and safer ways to travel
              </Text>
            </View>

            <View style={styles.featuresGrid}>
              <View style={[styles.featureCard, dynamicStyles.card, dynamicStyles.border]}>
                <View style={[styles.featureIconContainer, dynamicStyles.iconBg]}>
                  <Ionicons name="speedometer" size={28} color="#4FD1C5" />
                </View>
                <Text style={[styles.featureTitle, dynamicStyles.text]}>Fast Booking</Text>
                <Text style={[styles.featureDesc, dynamicStyles.subText]}>
                  Get a ride in seconds with our quick booking
                </Text>
              </View>

              <View style={[styles.featureCard, dynamicStyles.card, dynamicStyles.border]}>
                <View style={[styles.featureIconContainer, dynamicStyles.iconBg]}>
                  <Ionicons name="shield-checkmark" size={28} color="#4FD1C5" />
                </View>
                <Text style={[styles.featureTitle, dynamicStyles.text]}>Safe & Secure</Text>
                <Text style={[styles.featureDesc, dynamicStyles.subText]}>
                  Live tracking and emergency support
                </Text>
              </View>

              <View style={[styles.featureCard, dynamicStyles.card, dynamicStyles.border]}>
                <View style={[styles.featureIconContainer, dynamicStyles.iconBg]}>
                  <Ionicons name="wallet" size={28} color="#4FD1C5" />
                </View>
                <Text style={[styles.featureTitle, dynamicStyles.text]}>Easy Payment</Text>
                <Text style={[styles.featureDesc, dynamicStyles.subText]}>
                  Multiple payment options available
                </Text>
              </View>

              <View style={[styles.featureCard, dynamicStyles.card, dynamicStyles.border]}>
                <View style={[styles.featureIconContainer, dynamicStyles.iconBg]}>
                  <Ionicons name="star" size={28} color="#4FD1C5" />
                </View>
                <Text style={[styles.featureTitle, dynamicStyles.text]}>Top Drivers</Text>
                <Text style={[styles.featureDesc, dynamicStyles.subText]}>
                  Verified and highly rated drivers
                </Text>
              </View>
            </View>
          </View>

          {/* WHY CHOOSE US */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, dynamicStyles.text]}>Why Choose Chardho GO+?</Text>
              <Text style={[styles.sectionDesc, dynamicStyles.subText]}>
                We provide a seamless and secure booking experience
              </Text>
            </View>

            <View style={styles.benefitsContainer}>
              <View style={[styles.benefitItem, dynamicStyles.card, dynamicStyles.border]}>
                <View style={styles.benefitIconCircle}>
                  <Ionicons name="location" size={22} color="#fff" />
                </View>
                <View style={styles.benefitTextContainer}>
                  <Text style={[styles.benefitTitle, dynamicStyles.text]}>Real-Time Tracking</Text>
                  <Text style={[styles.benefitDesc, dynamicStyles.subText]}>Track your ride live on the map</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.subText} />
              </View>

              <View style={[styles.benefitItem, dynamicStyles.card, dynamicStyles.border]}>
                <View style={styles.benefitIconCircle}>
                  <Ionicons name="card" size={22} color="#fff" />
                </View>
                <View style={styles.benefitTextContainer}>
                  <Text style={[styles.benefitTitle, dynamicStyles.text]}>Flexible Payments</Text>
                  <Text style={[styles.benefitDesc, dynamicStyles.subText]}>Cards, UPI, wallets, or cash</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.subText} />
              </View>

              <View style={[styles.benefitItem, dynamicStyles.card, dynamicStyles.border]}>
                <View style={styles.benefitIconCircle}>
                  <Ionicons name="calendar" size={22} color="#fff" />
                </View>
                <View style={styles.benefitTextContainer}>
                  <Text style={[styles.benefitTitle, dynamicStyles.text]}>Schedule Rides</Text>
                  <Text style={[styles.benefitDesc, dynamicStyles.subText]}>Book rides in advance</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.subText} />
              </View>

              <View style={[styles.benefitItem, dynamicStyles.card, dynamicStyles.border]}>
                <View style={styles.benefitIconCircle}>
                  <Ionicons name="people" size={22} color="#fff" />
                </View>
                <View style={styles.benefitTextContainer}>
                  <Text style={[styles.benefitTitle, dynamicStyles.text]}>Share Rides</Text>
                  <Text style={[styles.benefitDesc, dynamicStyles.subText]}>Save money with carpooling</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.subText} />
              </View>
            </View>
          </View>

          {/* FOOTER */}
          <View style={[styles.footer, dynamicStyles.border]}>
            <Text style={[styles.footerText, dynamicStyles.subText]}>© 2024 Chardho GO+. All rights reserved.</Text>
            <Text style={[styles.footerSubtext, dynamicStyles.subText]}>Go further, for less.</Text>
          </View>
        </View>
      </ScrollView>

    </>
  );
}

/* ------------------- STYLES --------------------- */

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#f7f7f6",
  },

  /* HERO SECTION */
  heroContainer: {
    backgroundColor: "#0F2027",
  },
  heroGradient: {
    paddingBottom: 40,
  },
  heroContent: {
    padding: 20,
    paddingTop: 20,
  },
  heroTextContainer: {
    marginBottom: 30,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: "900",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 50,
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroHighlight: {
    color: "#4FD1C5",
    textShadowColor: 'rgba(79, 209, 197, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
    fontWeight: "500",
  },

  /* SEARCH */
  searchContainer: {
    marginBottom: 24,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: "#e8e8e8",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  searchIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(79, 209, 197, 0.15)",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  searchTextContainer: {
    flex: 1,
  },
  searchLabel: {
    fontSize: 12,
    color: "#999",
    marginBottom: 2,
    fontWeight: "500",
  },
  searchPlaceholder: {
    fontSize: 16,
    color: "#1a1a1a",
    fontWeight: "600",
  },
  searchBtn: {
    backgroundColor: "#4FD1C5",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4FD1C5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  /* QUICK ACTIONS */
  quickActions: {
    flexDirection: "row",
    gap: 12,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: "#fff",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
  },
  quickActionBtnPrimary: {
    backgroundColor: "#4FD1C5",
    borderColor: "#4FD1C5",
    shadowColor: "#4FD1C5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  quickActionIconBg: {
    width: 36,
    height: 36,
    backgroundColor: "rgba(79, 209, 197, 0.15)",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  quickActionIconBgPrimary: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2C5364",
  },
  quickActionTextPrimary: {
    color: "#fff",
  },

  /* CONTAINER */
  container: {
    padding: 20,
  },

  /* SECTIONS */
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1a1a1a",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  sectionDesc: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },

  /* RIDE OPTIONS */
  rideOptionsScroll: {
    gap: 16,
    paddingRight: 20,
  },
  rideOption: {
    width: 140,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  rideIconBg: {
    width: 64,
    height: 64,
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  rideOptionContent: {
    alignItems: "center",
    width: "100%",
  },
  rideOptionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  rideOptionPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#667eea",
    marginBottom: 8,
  },
  rideOptionBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  rideOptionBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#667eea",
  },

  /* PROMO BANNER */
  promoBanner: {
    borderRadius: 20,
    marginBottom: 40,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  promoGradient: {
    padding: 24,
  },
  promoContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  promoTextContainer: {
    flex: 1,
  },
  promoTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  promoTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
  },
  promoTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  promoDesc: {
    fontSize: 16,
    color: "#f5f0e8",
    fontWeight: "700",
  },
  promoIconContainer: {
    marginLeft: 16,
  },

  /* FEATURES GRID */
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  featureCard: {
    width: (width - 56) / 2,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    backgroundColor: "rgba(79, 209, 197, 0.15)",
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },

  /* BENEFITS */
  benefitsContainer: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#e8e8e8",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  benefitIconCircle: {
    width: 48,
    height: 48,
    backgroundColor: "#667eea",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  benefitTextContainer: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1a1a1a",
    marginBottom: 3,
  },
  benefitDesc: {
    fontSize: 13,
    color: "#666",
  },

  /* FOOTER */
  footer: {
    paddingVertical: 30,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
    color: "#999",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: "#bbb",
    fontStyle: "italic",
  },
});