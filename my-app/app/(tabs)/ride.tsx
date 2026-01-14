import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';

export default function RidePlaceholder() {
    useEffect(() => {
        // Auto-redirect to booking after a short delay
        const timer = setTimeout(() => {
            router.push('/booking' as any);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#0F2027', '#203A43', '#2C5364']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    {/* Icon */}
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={['#4FD1C5', '#667eea']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="car-sport" size={64} color="#fff" />
                        </LinearGradient>
                    </View>

                    {/* Title */}
                    <Text style={styles.title}>Ready to Ride?</Text>
                    <Text style={styles.subtitle}>
                        Let's find you the perfect ride
                    </Text>

                    {/* Quick Actions */}
                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={() => router.push('/booking' as any)}
                        >
                            <LinearGradient
                                colors={['#4FD1C5', '#38B2AC']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.buttonGradient}
                            >
                                <Ionicons name="add-circle" size={24} color="#fff" />
                                <Text style={styles.primaryButtonText}>Book a Ride</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => router.push('/trips' as any)}
                        >
                            <Ionicons name="time" size={20} color="#4FD1C5" />
                            <Text style={styles.secondaryButtonText}>View Trip History</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Features */}
                    <View style={styles.featuresContainer}>
                        <View style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Ionicons name="flash" size={24} color="#4FD1C5" />
                            </View>
                            <Text style={styles.featureText}>Quick Booking</Text>
                        </View>

                        <View style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Ionicons name="shield-checkmark" size={24} color="#4FD1C5" />
                            </View>
                            <Text style={styles.featureText}>Safe & Secure</Text>
                        </View>

                        <View style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Ionicons name="wallet" size={24} color="#4FD1C5" />
                            </View>
                            <Text style={styles.featureText}>Easy Payment</Text>
                        </View>
                    </View>

                    {/* Redirecting indicator */}
                    <View style={styles.redirectContainer}>
                        <View style={styles.loadingDot} />
                        <Text style={styles.redirectText}>Redirecting to booking...</Text>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    iconContainer: {
        marginBottom: 32,
    },
    iconGradient: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4FD1C5',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
    },
    title: {
        fontSize: 36,
        fontWeight: '900',
        color: '#ffffff',
        marginBottom: 12,
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginBottom: 48,
    },
    actionsContainer: {
        width: '100%',
        gap: 16,
        marginBottom: 48,
    },
    primaryButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#4FD1C5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 32,
        gap: 12,
    },
    primaryButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'rgba(79, 209, 197, 0.3)',
        gap: 8,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4FD1C5',
    },
    featuresContainer: {
        flexDirection: 'row',
        gap: 24,
        marginBottom: 48,
    },
    featureItem: {
        alignItems: 'center',
        gap: 8,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(79, 209, 197, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.7)',
    },
    redirectContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loadingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4FD1C5',
    },
    redirectText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.6)',
        fontStyle: 'italic',
    },
});
