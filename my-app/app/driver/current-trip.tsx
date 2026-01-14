import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator, ScrollView, Linking, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { Marker, Polyline } from "@/components/map/MapComponents";
import * as Location from "expo-location";
import { bookingAPI } from "../../services/bookingAPI";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { socketService } from "../../services/socketService";
import { routingService, RouteOption, RouteResponse } from "../../services/routing";
import { throttle } from "../../utils/helpers";
import RouteSelectionModal from "../../components/booking/RouteSelectionModal";
import { useSettings } from "../../context/SettingsContext";
import CustomMarker from "../../components/map/CustomMarker";

export default function CurrentTrip() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const { colors, darkMode } = useSettings();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);

  // Route Selection State
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([]);
  const [selectedRouteType, setSelectedRouteType] = useState<'fastest' | 'shortest' | 'balanced'>('fastest');
  const [recommendedRoute, setRecommendedRoute] = useState<'fastest' | 'shortest' | 'balanced'>('fastest');
  const [routeLoading, setRouteLoading] = useState(false);

  // PIN Verification State
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const pinInputRef = useRef<any>(null);

  const mapRef = useRef<MapView>(null);

  // Throttled socket updater (created once)
  const throttledSocketUpdate = useRef(
    throttle((data: any) => {
      socketService.updateLocation(data);
    }, 2000)
  ).current;

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    const initBooking = async () => {
      let id = Array.isArray(bookingId) ? bookingId[0] : bookingId;

      // If we have a valid ID passed via params, save it
      if (id && id !== "undefined") {
        await AsyncStorage.setItem('driverActiveBookingId', id);
      } else {
        // Fallback: try to recover from storage
        id = await AsyncStorage.getItem('driverActiveBookingId');
      }

      if (id && id !== "undefined") {
        // If we found an ID (from params or storage), load it
        loadBookingDetails(id);
      } else {
        setLoading(false);
      }
    };

    initBooking();
    startLocationTracking();

    const socket = socketService.getSocket();
    if (socket) {
      socket.on('booking:cancelled', async () => {
        Alert.alert('Ride Cancelled', 'The user has cancelled the ride.');
        await AsyncStorage.removeItem('driverActiveBookingId');
        router.replace('/driver/tabs/dashboard');
      });
    }

    return () => {
      socket?.off('booking:cancelled');
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, [bookingId]);

  // Auto-verify PIN when 4 digits are entered
  useEffect(() => {
    if (pinInput.length === 4 && showPinModal && !actionLoading) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        handleVerifyPin();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pinInput]);

  useEffect(() => {
    let isMounted = true;
    const updateRoute = async () => {
      if (currentLocation && booking?.pickup?.coordinates) {
        // If in_progress, route to destination, else route to pickup
        const target = booking.status === 'in_progress' ? booking.destination.coordinates : booking.pickup.coordinates;

        // Get the selected route or default to fastest
        const selectedRoute = routeOptions.find(r => r.type === selectedRouteType);
        if (selectedRoute && selectedRoute.coordinates.length > 0) {
          setRouteCoordinates(selectedRoute.coordinates);
        } else {
          // Fallback to basic route
          const route = await routingService.getRoute(currentLocation, target);
          if (isMounted && route.length > 0) {
            setRouteCoordinates(route);
          }
        }
      }
    };

    // Throttle calls
    const timeout = setTimeout(updateRoute, 1000);
    return () => { isMounted = false; clearTimeout(timeout); };
  }, [currentLocation, booking, selectedRouteType, routeOptions]);

  // Fetch route options when trip starts or location changes significantly
  const fetchRouteOptions = async () => {
    if (!currentLocation || !booking?.pickup?.coordinates) return;

    try {
      setRouteLoading(true);
      const target = booking.status === 'in_progress' ? booking.destination.coordinates : booking.pickup.coordinates;

      // Determine vehicle type from booking
      const vehicleType = (booking.rideType?.id || 'bike') as 'bike' | 'auto' | 'car' | 'suv';

      const routeResponse: RouteResponse = await routingService.getRouteOptions(
        currentLocation,
        target,
        vehicleType
      );

      setRouteOptions(routeResponse.routes);
      setRecommendedRoute(routeResponse.recommended);

      // Auto-select recommended route
      const recommended = routeResponse.routes.find(r => r.type === routeResponse.recommended);
      if (recommended) {
        setSelectedRouteType(routeResponse.recommended);
        setRouteCoordinates(recommended.coordinates);
      }
    } catch (error) {
      console.error('Error fetching route options:', error);
    } finally {
      setRouteLoading(false);
    }
  };

  const getBookingId = async () => {
    let id = Array.isArray(bookingId) ? bookingId[0] : bookingId;
    if (!id || id === 'undefined') {
      id = await AsyncStorage.getItem('driverActiveBookingId');
    }
    return id;
  };

  const handleCall = async () => {
    try {
      const phoneNumber = booking?.user?.phone;
      if (!phoneNumber) {
        Alert.alert("Error", "Phone number not available");
        return;
      }

      const phoneUrl = `tel:${phoneNumber}`;
      const canOpen = await Linking.canOpenURL(phoneUrl);

      if (canOpen) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert("Error", "Unable to make phone calls on this device");
      }
    } catch (error) {
      console.error("Error making call:", error);
      Alert.alert("Error", "Failed to initiate call");
    }
  };


  const handleArrived = async () => {
    try {
      setActionLoading(true);
      const id = await getBookingId();
      if (!id) throw new Error("Booking ID not found");

      const response = await bookingAPI.driverArrived(id);
      if (response.success) {
        // Alert.alert("Status Updated", "User has been notified that you arrived.");
        loadBookingDetails(id);
      } else {
        Alert.alert("Error", response.message || "Failed to update status");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyPin = async () => {
    if (pinInput.length !== 4) {
      Alert.alert("Invalid PIN", "Please enter the 4-digit PIN provided by the user.");
      return;
    }

    try {
      setActionLoading(true);
      const id = await getBookingId();
      if (!id) throw new Error("Booking ID not found");

      const response = await bookingAPI.verifyPin(id, pinInput);

      if (response.success) {
        setShowPinModal(false);
        setPinInput("");
        // Alert.alert("Success", "Ride Started!");
        loadBookingDetails(id);
      } else {
        // Clear PIN on error for retry
        setPinInput("");
        Alert.alert("Verification Failed", response.message || "Incorrect PIN. Please try again.");
      }
    } catch (error: any) {
      // Clear PIN on error for retry
      setPinInput("");
      Alert.alert("Error", error.response?.data?.message || "Failed to verify PIN. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTrip = async () => {
    try {
      console.log('🏁 Attempting to complete trip for Booking ID:', bookingId);
      setActionLoading(true);

      const id = await getBookingId();
      if (!id) throw new Error("Booking ID not found");

      const response = await bookingAPI.completeBooking(id, currentLocation);

      if (response.success) {
        // Navigate to Payment Screen instead of Dashboard
        router.replace({
          pathname: "/driver/payment-collected",
          params: { bookingData: JSON.stringify(response.booking) }
        } as any);
      } else {
        Alert.alert("Error", response.message || "Failed to complete trip");
      }
    } catch (error: any) {
      if (error.response?.status === 403 || error.response?.status === 401) {
        // Session expired, AuthContext/Interceptor will handle logout
        console.warn('Session expired during trip completion');
      } else {
        const message = error.response?.data?.message || error.message;
        Alert.alert("Error", message || "Something went wrong while completing the trip");
      }
    } finally {
      setActionLoading(false);
    }
  };

  async function loadBookingDetails(specificId?: string) {
    try {
      const id = specificId || await getBookingId();
      if (!id) {
        console.warn('No booking ID found');
        return;
      }

      // Don't set full page loading on refresh
      const response = await bookingAPI.getBooking(id);
      if (response.success) {
        setBooking(response.booking);
      }
    } catch (error: any) {
      console.error("Load booking error:", error);

      // Check if it's a network error
      const isNetworkError = error.message === 'Network Error' || error.code === 'ERR_NETWORK';

      // Only exit if we have NO data at all
      if (!booking) {
        const errorMessage = isNetworkError
          ? "Cannot connect to server. Please check your internet connection and ensure the backend server is running."
          : "Failed to load booking details";

        Alert.alert(
          isNetworkError ? "Connection Error" : "Error",
          errorMessage,
          [
            {
              text: "Go to Dashboard",
              onPress: () => router.replace("/driver/tabs/dashboard" as any)
            }
          ]
        );
      } else {
        // We have cached data, just log the error
        console.log('Using cached booking data due to network error');
      }
    } finally {
      setLoading(false);
    }
  };

  async function startLocationTracking() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = null;
        try {
          loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          console.log('✓ Current location acquired successfully');
        } catch (posError) {
          console.info("ℹ Current position unavailable, using last known location (this is normal)");
          try {
            loc = await Location.getLastKnownPositionAsync({});
            if (loc) {
              console.log('✓ Last known location retrieved successfully');
            }
          } catch (lastKnownError) {
            console.error('✗ Failed to get any location data:', lastKnownError);
          }
        }

        if (loc) {
          const coords = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          setCurrentLocation(coords);
        } else {
          console.warn('⚠ No location data available - map may not center correctly');
          Alert.alert(
            'Location Unavailable',
            'Unable to get your current location. Please ensure location services are enabled and try again.',
            [{ text: 'OK' }]
          );
        }

        locationSubscription.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 10 },
          async (newLoc) => {
            const newCoords = {
              latitude: newLoc.coords.latitude,
              longitude: newLoc.coords.longitude,
            };
            setCurrentLocation(newCoords);

            // Emit to socket for user tracking
            const id = await getBookingId();
            if (id) {
              throttledSocketUpdate({
                driverId: booking?.driver?._id || '',
                location: newCoords,
                bookingId: id
              });
            }
          }
        );
      }
    } catch (error) {
      console.error("Location tracking error in current-trip:", error);
    }
  };

  const dynamicStyles = {
    container: { backgroundColor: colors.background },
    sheet: { backgroundColor: colors.card, shadowColor: darkMode ? '#000' : '#ccc' },
    text: { color: colors.text },
    subText: { color: colors.subText },
    pinBox: { backgroundColor: darkMode ? '#1E1E1E' : '#f9f9f9', borderColor: colors.border },
    pinText: { color: colors.primary },
    button: { backgroundColor: darkMode ? '#333' : '#f5f5f5' },
    modalContent: { backgroundColor: colors.card },
    pinBoxFilled: { backgroundColor: darkMode ? 'rgba(79, 209, 197, 0.1)' : 'rgba(79, 209, 197, 0.1)' }
  };

  if (loading) return <LoadingSpinner text="Starting your trip..." />;

  if (!booking) {
    return (
      <View style={[styles.center, dynamicStyles.container]}>
        <Ionicons name="car-outline" size={64} color={colors.subText} />
        <Text style={[styles.errorText, dynamicStyles.subText]}>No active trip found.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace("/driver/tabs/dashboard" as any)}>
          <Text style={styles.backBtnText}>Go to Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pickupCoords = booking.pickup.coordinates;
  const destCoords = booking.destination.coordinates;
  const isPickupPhase = booking.status === 'accepted' || booking.status === 'driver_arrived';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      {/* Map Area - Full Screen */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: pickupCoords.latitude,
          longitude: pickupCoords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <Marker coordinate={pickupCoords} title="Pickup" anchor={{ x: 0.5, y: 1 }}>
          <CustomMarker type="pickup" />
        </Marker>
        <Marker coordinate={destCoords} title="Destination" anchor={{ x: 0.5, y: 1 }}>
          <CustomMarker type="destination" />
        </Marker>

        {currentLocation && (
          <Marker coordinate={currentLocation} title="You" anchor={{ x: 0.5, y: 1 }}>
            <CustomMarker type="driver" />
          </Marker>
        )}

        {routeCoordinates.length > 0 && (
          <Polyline coordinates={routeCoordinates} strokeColor="#4FD1C5" strokeWidth={5} />
        )}
      </MapView>

      {/* Status Banner */}
      <View style={styles.statusBanner}>
        <LinearGradient
          colors={isPickupPhase ? ['#4FD1C5', '#38B2AC'] : ['#f44336', '#d32f2f']}
          style={styles.statusGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.statusContent}>
            <View style={styles.statusIconContainer}>
              <Ionicons
                name={isPickupPhase ? "navigate" : "flag"}
                size={24}
                color="#fff"
              />
            </View>
            <View style={styles.statusTextContainer}>
              <Text style={styles.statusTitle}>
                {booking.status === 'accepted' ? 'Heading to Pickup' :
                  booking.status === 'driver_arrived' ? 'Arrived at Pickup' :
                    'Trip in Progress'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {isPickupPhase ? booking.pickup.name : booking.destination.name}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Floating Action Buttons */}
      <View style={styles.floatingActions}>
        <TouchableOpacity
          onPress={() => router.replace('/driver/tabs/dashboard' as any)}
          style={[styles.floatingBtn, dynamicStyles.sheet]}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        {(booking.status === 'accepted' || booking.status === 'in_progress') && (
          <TouchableOpacity
            style={[styles.floatingBtn, dynamicStyles.sheet]}
            onPress={() => {
              if (routeOptions.length === 0) {
                fetchRouteOptions();
              }
              setShowRouteModal(true);
            }}
          >
            <Ionicons name="map-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Info Card */}
      <View style={[styles.bottomSheet, dynamicStyles.sheet]}>
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Passenger Header Row: Avatar - Name/Details - Call */}
          <View style={[styles.passengerHeaderRow, { borderBottomColor: colors.border }]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{booking.user?.name?.charAt(0) || 'U'}</Text>
            </View>

            <View style={styles.passengerCenterInfo}>
              <Text style={[styles.passengerName, dynamicStyles.text]}>{booking.user?.name || 'Passenger'}</Text>
              <View style={styles.statusBadge}>
                <View style={[styles.statusDot, {
                  backgroundColor: booking.status === 'in_progress' ? '#4CAF50' : '#FFA726'
                }]} />
                <Text style={[styles.statusText, dynamicStyles.subText]}>
                  {booking.status === 'accepted' ? 'En Route' :
                    booking.status === 'driver_arrived' ? 'Waiting' :
                      'In Progress'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.callButton} onPress={handleCall}>
              <Ionicons name="call" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Trip Details */}
          <View style={styles.tripDetails}>
            <View style={styles.locationItem}>
              <View style={styles.locationIconContainer}>
                <View style={[styles.locationDot, { backgroundColor: '#4FD1C5' }]} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>PICKUP LOCATION</Text>
                <Text style={[styles.locationValue, dynamicStyles.text]} numberOfLines={1}>{booking.pickup.name}</Text>
              </View>
            </View>

            <View style={styles.locationConnector} />

            <View style={styles.locationItem}>
              <View style={styles.locationIconContainer}>
                <View style={[styles.locationDot, { backgroundColor: '#f44336' }]} />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>DROP-OFF LOCATION</Text>
                <Text style={[styles.locationValue, dynamicStyles.text]} numberOfLines={1}>{booking.destination.name}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            {booking.status === 'accepted' && (
              <TouchableOpacity
                style={[styles.primaryActionBtn, actionLoading && styles.disabledBtn]}
                onPress={handleArrived}
                disabled={actionLoading}
              >
                <LinearGradient
                  colors={['#4FD1C5', '#38B2AC']}
                  style={styles.actionBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={24} color="#fff" />
                      <Text style={styles.primaryActionText}>I've Arrived</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {booking.status === 'driver_arrived' && (
              <TouchableOpacity
                style={[styles.primaryActionBtn, actionLoading && styles.disabledBtn]}
                onPress={() => setShowPinModal(true)}
                disabled={actionLoading}
              >
                <LinearGradient
                  colors={['#4FD1C5', '#38B2AC']}
                  style={styles.actionBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Ionicons name="key" size={24} color="#fff" />
                  <Text style={styles.primaryActionText}>Start Ride</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            {booking.status === 'in_progress' && (
              <TouchableOpacity
                style={[styles.primaryActionBtn, actionLoading && styles.disabledBtn]}
                onPress={handleCompleteTrip}
                disabled={actionLoading}
              >
                <LinearGradient
                  colors={['#f44336', '#d32f2f']}
                  style={styles.actionBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="flag" size={24} color="#fff" />
                      <Text style={styles.primaryActionText}>Complete Ride</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Route Selection Modal */}
      <RouteSelectionModal
        visible={showRouteModal}
        onClose={() => setShowRouteModal(false)}
        onSelectRoute={(route) => {
          setSelectedRouteType(route.type);
          setRouteCoordinates(route.coordinates);
        }}
        routes={routeOptions}
        recommended={recommendedRoute}
        loading={routeLoading}
      />

      {/* PIN Verification Modal */}
      <Modal visible={showPinModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, dynamicStyles.modalContent]}>
            {/* Close Button */}
            <TouchableOpacity
              style={[styles.modalCloseBtn, dynamicStyles.button]}
              onPress={() => {
                setShowPinModal(false);
                setPinInput("");
              }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            {/* Icon */}
            <View style={styles.modalIconContainer}>
              <LinearGradient
                colors={['#4FD1C5', '#38B2AC']}
                style={styles.modalIconGradient}
              >
                <Ionicons name="lock-closed" size={40} color="#fff" />
              </LinearGradient>
            </View>

            {/* Title */}
            <Text style={[styles.modalTitle, dynamicStyles.text]}>Enter Verification PIN</Text>
            <Text style={[styles.modalSubtitle, dynamicStyles.subText]}>
              Ask the passenger for their 4-digit PIN to start the ride
            </Text>

            {/* PIN Input Boxes */}
            <View style={styles.pinInputWrapper}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => pinInputRef.current?.focus()}
                style={styles.pinContainer}
              >
                {[0, 1, 2, 3].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.pinBox,
                      dynamicStyles.pinBox,
                      pinInput.length > index && styles.pinBoxFilled,
                      pinInput.length > index && dynamicStyles.pinBoxFilled,
                      pinInput.length === index && styles.pinBoxActive,
                    ]}
                  >
                    <Text style={styles.pinBoxText}>
                      {pinInput[index] ? '●' : ''}
                    </Text>
                  </View>
                ))}
              </TouchableOpacity>

              {/* Hidden Input for Keyboard */}
              <TextInput
                ref={pinInputRef}
                style={styles.hiddenInput}
                value={pinInput}
                onChangeText={setPinInput}
                keyboardType="number-pad"
                maxLength={4}
                autoFocus
                selectTextOnFocus
              />
            </View>

            {/* Helper Text */}
            <Text style={[styles.helperText, dynamicStyles.subText]}>
              Tap above to enter PIN
            </Text>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.cancelModalBtn, dynamicStyles.button, { borderColor: colors.border }]}
                onPress={() => {
                  setShowPinModal(false);
                  setPinInput("");
                }}
              >
                <Text style={[styles.cancelModalText, dynamicStyles.text]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.verifyBtn,
                  (actionLoading || pinInput.length !== 4) && styles.disabledBtn
                ]}
                onPress={handleVerifyPin}
                disabled={actionLoading || pinInput.length !== 4}
              >
                <LinearGradient
                  colors={pinInput.length === 4 ? ['#4FD1C5', '#38B2AC'] : ['#ccc', '#aaa']}
                  style={styles.verifyBtnGradient}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#fff" />
                      <Text style={styles.verifyBtnText}>Verify & Start</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5"
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%'
  },

  // Status Banner
  statusBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  statusGradient: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },

  // Floating Actions
  floatingActions: {
    position: 'absolute',
    top: 120,
    left: 20,
    zIndex: 10,
    gap: 12,
  },
  floatingBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
    maxHeight: '50%',
  },
  scrollContent: {
    flex: 1,
  },

  // Passenger Header Row
  passengerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4FD1C510',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
    borderColor: '#4FD1C5',
  },
  avatarText: {
    color: '#4FD1C5',
    fontSize: 22,
    fontWeight: '800'
  },
  passengerCenterInfo: {
    flex: 1,
    marginLeft: 12,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },

  // Trip Details
  tripDetails: {
    marginBottom: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  locationInfo: {
    flex: 1,
    paddingVertical: 4,
  },
  locationLabel: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  locationConnector: {
    width: 2,
    height: 20,
    backgroundColor: '#e0e0e0',
    marginLeft: 15,
    marginVertical: 4,
  },

  // Action Section
  actionSection: {
    gap: 12,
  },
  primaryActionBtn: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 10,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disabledBtn: {
    opacity: 0.6,
  },

  // Driver Marker
  driverMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4FD1C5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '100%',
    maxWidth: 360,
    padding: 28,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconContainer: {
    marginBottom: 20,
  },
  modalIconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  pinInputWrapper: {
    position: 'relative',
    width: '100%',
    alignItems: 'center',
  },
  pinContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    justifyContent: 'center',
  },
  pinBox: {
    width: 60,
    height: 70,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  pinBoxActive: {
    borderColor: '#4FD1C5',
    backgroundColor: '#fff',
    shadowColor: '#4FD1C5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  pinBoxFilled: {
    borderColor: '#4FD1C5',
    backgroundColor: 'rgba(79, 209, 197, 0.1)',
  },
  pinBoxText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#4FD1C5',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 70,
    opacity: 0.01,
    color: 'transparent',
    fontSize: 1,
  },
  helperText: {
    fontSize: 13,
    color: '#999',
    marginBottom: 24,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%'
  },
  cancelModalBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelModalText: {
    color: '#666',
    fontWeight: '700',
    fontSize: 15,
  },
  verifyBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#4FD1C5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  verifyBtnGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  verifyBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },

  // Error States
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#999',
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  backBtn: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#4FD1C5',
    borderRadius: 14,
    paddingHorizontal: 32,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
});
