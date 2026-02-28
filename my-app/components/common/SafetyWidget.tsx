import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
    Modal,
    Linking,
    Share,
    Alert,
    Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width } = Dimensions.get('window');

interface SafetyWidgetProps {
    variant?: 'floating' | 'header';
    color?: string;
}

export default function SafetyWidget({ variant = 'floating', color = '#fff' }: SafetyWidgetProps) {
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);

    const handleEmergencyCall = () => {
        const number = '100'; // India Police
        const phoneNumber = Platform.OS === 'ios' ? `telprompt:${number}` : `tel:${number}`;
        Linking.openURL(phoneNumber);
        setModalVisible(false);
    };

    const handleShareRide = async () => {
        try {
            await Share.share({
                message: 'I am on a ride with Chardho GO+. Track my ride here: [Link]',
            });
        } catch (error) {
            console.error(error);
        }
        setModalVisible(false);
    };

    const navigateToSettings = () => {
        setModalVisible(false);
        router.push("/account/sos" as any);
    };

    return (
        <>
            {variant === 'floating' ? (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <View style={styles.shieldContainer}>
                        <Ionicons name="shield-checkmark" size={24} color="#fff" />
                        <View style={styles.statusDot} />
                    </View>
                    <Text style={styles.fabLabel}>Safety</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity
                    style={styles.headerBtn}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="shield-checkmark" size={24} color={color} />
                    <View style={[styles.statusDotHeader, { borderColor: color === '#fff' ? '#2C5364' : '#fff' }]} />
                </TouchableOpacity>
            )}

            {/* Safety Toolkit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={styles.dragIndicator} />
                            <Text style={styles.modalTitle}>Safety Toolkit</Text>
                            <Text style={styles.modalSubtitle}>Trusted contacts & emergency help</Text>
                        </View>

                        <View style={styles.actionsGrid}>
                            {/* Emergency Call */}
                            <TouchableOpacity
                                style={[styles.actionCard, styles.emergencyCard]}
                                onPress={handleEmergencyCall}
                            >
                                <View style={[styles.iconCircle, styles.emergencyIconBg]}>
                                    <Ionicons name="call" size={24} color="#fff" />
                                </View>
                                <Text style={[styles.actionLabel, styles.emergencyText]}>Call 100</Text>
                                <Text style={styles.actionDesc}>Police Control</Text>
                            </TouchableOpacity>

                            {/* Share Ride */}
                            <TouchableOpacity style={styles.actionCard} onPress={handleShareRide}>
                                <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                                    <Ionicons name="location" size={24} color="#2196F3" />
                                </View>
                                <Text style={styles.actionLabel}>Share Ride</Text>
                                <Text style={styles.actionDesc}>Send live location</Text>
                            </TouchableOpacity>

                            {/* Safety Center */}
                            <TouchableOpacity style={styles.actionCard} onPress={navigateToSettings}>
                                <View style={[styles.iconCircle, { backgroundColor: '#E0F2F1' }]}>
                                    <Ionicons name="options" size={24} color="#009688" />
                                </View>
                                <Text style={styles.actionLabel}>Safety Center</Text>
                                <Text style={styles.actionDesc}>Manage contacts</Text>
                            </TouchableOpacity>

                            {/* Report Issue */}
                            <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert('Coming Soon', 'Reporting feature coming soon')}>
                                <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
                                    <Ionicons name="alert-circle" size={24} color="#F44336" />
                                </View>
                                <Text style={styles.actionLabel}>Report</Text>
                                <Text style={styles.actionDesc}>Safety issue</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 120 : 100, // Positioned safely near top right
        right: 16,
        backgroundColor: '#2C5364',
        borderRadius: 30,
        paddingVertical: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 6,
            }
        }),
        zIndex: 999,
    },
    headerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 4,
    },
    shieldContainer: {
        position: 'relative',
    },
    statusDot: {
        position: 'absolute',
        top: 0,
        right: -2,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4FD1C5',
        borderWidth: 1.5,
        borderColor: '#2C5364',
    },
    statusDotHeader: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4FD1C5',
        borderWidth: 1.5,
    },
    fabLabel: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
            },
            android: {
                elevation: 10,
            }
        }),
    },
    modalHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    dragIndicator: {
        width: 40,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    actionCard: {
        width: (width - 60) / 2, // 2 columns
        backgroundColor: '#f8f9fa',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    emergencyCard: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA',
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    emergencyIconBg: {
        backgroundColor: '#f44336',
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#333',
        marginBottom: 2,
    },
    emergencyText: {
        color: '#d32f2f',
    },
    actionDesc: {
        fontSize: 12,
        color: '#888',
        textAlign: 'center',
    },
    closeButton: {
        backgroundColor: '#f5f5f5',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
});
