import React, { useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Linking,
    Alert,
    Platform,
    StatusBar,
    TextInput,
    Modal,
    ActivityIndicator,
    KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { router } from "expo-router";
import { useSettings } from "../../context/SettingsContext";
import { userAPI } from "../../services/userAPI";

interface EmergencyContact {
    _id: string;
    id?: string;
    name: string;
    number: string;
    relation: string;
}

export default function SOS() {
    const { colors, darkMode } = useSettings();
    const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newContact, setNewContact] = useState({ name: '', number: '', relation: '' });

    React.useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            const response = await userAPI.getEmergencyContacts();
            if (response.success) {
                setEmergencyContacts(response.contacts);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddContact = async () => {
        if (!newContact.name || !newContact.number || !newContact.relation) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        setSaving(true);
        try {
            const response = await userAPI.addEmergencyContact(newContact);
            if (response.success) {
                setEmergencyContacts(response.contacts);
                setShowAddModal(false);
                setNewContact({ name: '', number: '', relation: '' });
                Alert.alert('Success', 'Emergency contact added');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    const confirmDelete = (id: string) => {
        Alert.alert(
            "Delete Contact",
            "Are you sure you want to delete this emergency contact?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => handleDeleteContact(id) }
            ]
        );
    };

    const handleDeleteContact = async (id: string) => {
        try {
            const response = await userAPI.deleteEmergencyContact(id);
            if (response.success) {
                setEmergencyContacts(response.contacts);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const emergencyServices = [
        {
            id: '1',
            name: 'Police',
            number: '100',
            icon: 'shield' as const,
            color: '#2196f3',
        },
        {
            id: '2',
            name: 'Ambulance',
            number: '102',
            icon: 'medical' as const,
            color: '#f44336',
        },
        {
            id: '3',
            name: 'Fire Brigade',
            number: '101',
            icon: 'flame' as const,
            color: '#ff9800',
        },
        {
            id: '4',
            name: 'Women Helpline',
            number: '1091',
            icon: 'woman' as const,
            color: '#9c27b0',
        },
    ];

    const handleEmergencyCall = (number: string, name: string) => {
        Alert.alert(
            `Call ${name}?`,
            `Are you sure you want to call ${number}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Call",
                    onPress: () => {
                        const phoneNumber = Platform.OS === 'ios' ? `telprompt:${number}` : `tel:${number}`;
                        Linking.openURL(phoneNumber);
                    },
                },
            ]
        );
    };

    const handleSOSAlert = () => {
        Alert.alert(
            "Emergency SOS",
            "This will send your location to your emergency contacts and alert local authorities. Continue?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Send SOS",
                    style: "destructive",
                    onPress: () => {
                        // Send SOS alert to backend (could be implemented later)
                        Alert.alert("SOS Sent", "Emergency alert sent to your contacts and authorities");
                    },
                },
            ]
        );
    };

    const handleShareLocation = () => {
        Alert.alert("Share Location", "Your live location will be shared with your emergency contacts");
    };

    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        card: { backgroundColor: colors.card, shadowColor: darkMode ? "#000" : "#ccc" },
        text: { color: colors.text },
        subText: { color: colors.subText },
        iconContainer: { backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(79, 209, 197, 0.1)' }
    };

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <StatusBar barStyle="light-content" />
            <LinearGradient
                colors={['#0F2027', '#203A43', '#2C5364']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Emergency SOS</Text>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
            >
                {/* Emergency SOS Button */}
                <TouchableOpacity
                    style={styles.sosButton}
                    onPress={handleSOSAlert}
                    activeOpacity={0.8}
                >
                    <View style={styles.sosIconContainer}>
                        <Ionicons name="warning" size={48} color="#fff" />
                    </View>
                    <Text style={styles.sosButtonText}>EMERGENCY SOS</Text>
                    <Text style={styles.sosButtonSubtext}>Tap to alert emergency contacts</Text>
                </TouchableOpacity>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity
                        style={[styles.quickAction, dynamicStyles.card]}
                        onPress={handleShareLocation}
                    >
                        <View style={[styles.quickActionIcon, dynamicStyles.iconContainer]}>
                            <Ionicons name="location" size={24} color="#4FD1C5" />
                        </View>
                        <Text style={[styles.quickActionText, dynamicStyles.text]}>Share Location</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.quickAction, dynamicStyles.card]}
                        onPress={() => Alert.alert("Recording", "Audio recording started")}
                    >
                        <View style={[styles.quickActionIcon, dynamicStyles.iconContainer]}>
                            <Ionicons name="mic" size={24} color="#4FD1C5" />
                        </View>
                        <Text style={[styles.quickActionText, dynamicStyles.text]}>Record Audio</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.quickAction, dynamicStyles.card]}
                        onPress={() => Alert.alert("Video", "Video recording started")}
                    >
                        <View style={[styles.quickActionIcon, dynamicStyles.iconContainer]}>
                            <Ionicons name="videocam" size={24} color="#4FD1C5" />
                        </View>
                        <Text style={[styles.quickActionText, dynamicStyles.text]}>Record Video</Text>
                    </TouchableOpacity>
                </View>

                {/* Emergency Services */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.text]}>Emergency Services</Text>
                    <View style={styles.servicesGrid}>
                        {emergencyServices.map((service) => (
                            <TouchableOpacity
                                key={service.id}
                                style={[styles.serviceCard, dynamicStyles.card, { borderLeftColor: service.color }]}
                                onPress={() => handleEmergencyCall(service.number, service.name)}
                            >
                                <View style={[styles.serviceIcon, { backgroundColor: `${service.color}15` }]}>
                                    <Ionicons name={service.icon} size={28} color={service.color} />
                                </View>
                                <View style={styles.serviceInfo}>
                                    <Text style={[styles.serviceName, dynamicStyles.text]}>{service.name}</Text>
                                    <Text style={[styles.serviceNumber, dynamicStyles.subText]}>{service.number}</Text>
                                </View>
                                <Ionicons name="call" size={24} color={service.color} />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Emergency Contacts */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={[styles.sectionTitle, dynamicStyles.text]}>Emergency Contacts</Text>
                        <TouchableOpacity onPress={() => setShowAddModal(true)}>
                            <Text style={styles.addLink}>+ Add</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <ActivityIndicator size="small" color="#4FD1C5" />
                    ) : emergencyContacts.length === 0 ? (
                        <Text style={[styles.emptyText, dynamicStyles.subText]}>No emergency contacts added yet.</Text>
                    ) : (
                        emergencyContacts.map((contact) => (
                            <View key={contact._id || contact.id} style={[styles.contactCard, dynamicStyles.card]}>
                                <View style={[styles.contactIcon, dynamicStyles.iconContainer]}>
                                    <Ionicons name="person" size={24} color="#4FD1C5" />
                                </View>
                                <View style={styles.contactInfo}>
                                    <Text style={[styles.contactName, dynamicStyles.text]}>{contact.name}</Text>
                                    <Text style={[styles.contactRelation, dynamicStyles.subText]}>{contact.relation}</Text>
                                    <Text style={[styles.contactNumber, dynamicStyles.subText]}>{contact.number}</Text>
                                </View>
                                <View style={styles.contactActions}>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.callAction]}
                                        onPress={() => handleEmergencyCall(contact.number, contact.name)}
                                    >
                                        <Ionicons name="call" size={20} color="#fff" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.deleteAction]}
                                        onPress={() => confirmDelete(contact._id || contact.id || '')}
                                    >
                                        <Ionicons name="trash" size={20} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Add Contact Modal */}
                <Modal
                    visible={showAddModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => setShowAddModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, dynamicStyles.card]}>
                            <Text style={[styles.modalTitle, dynamicStyles.text]}>Add Emergency Contact</Text>

                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                placeholder="Name"
                                placeholderTextColor={colors.subText}
                                value={newContact.name}
                                onChangeText={(text) => setNewContact({ ...newContact, name: text })}
                            />

                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                placeholder="Phone Number"
                                placeholderTextColor={colors.subText}
                                value={newContact.number}
                                keyboardType="phone-pad"
                                onChangeText={(text) => setNewContact({ ...newContact, number: text })}
                            />

                            <TextInput
                                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                                placeholder="Relation (e.g. Father)"
                                placeholderTextColor={colors.subText}
                                value={newContact.relation}
                                onChangeText={(text) => setNewContact({ ...newContact, relation: text })}
                            />

                            <View style={styles.modalButtons}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.cancelButton]}
                                    onPress={() => setShowAddModal(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.saveButton]}
                                    onPress={handleAddContact}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.saveButtonText}>Save</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Safety Tips */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Safety Tips</Text>
                    <View style={[styles.tipCard, dynamicStyles.card]}>
                        <Ionicons name="information-circle" size={24} color="#4FD1C5" />
                        <View style={styles.tipContent}>
                            <Text style={[styles.tipTitle, dynamicStyles.text]}>Stay Safe</Text>
                            <Text style={[styles.tipText, dynamicStyles.subText]}>
                                • Always share your trip details with family{'\n'}
                                • Verify driver details before boarding{'\n'}
                                • Use in-app emergency features{'\n'}
                                • Trust your instincts
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f7f7f6",
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
        backgroundColor: '#2C5364', // Fallback
    },
    backButton: {
        padding: 8,
        marginRight: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    sosButton: {
        backgroundColor: "#ff4757", // Vibrant red
        borderRadius: 24,
        padding: 32,
        alignItems: "center",
        marginBottom: 24,
        elevation: 8,
        shadowColor: "#ff4757",
        shadowOpacity: 0.4,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
    },
    sosIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: "rgba(255,255,255,0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    sosButtonText: {
        fontSize: 24,
        fontWeight: "800",
        color: "#fff",
        marginBottom: 8,
    },
    sosButtonSubtext: {
        fontSize: 14,
        color: "rgba(255,255,255,0.9)",
        textAlign: "center",
        fontWeight: '500',
    },
    quickActions: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 24,
    },
    quickAction: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 16,
        alignItems: "center",
        gap: 12,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    quickActionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(79, 209, 197, 0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    quickActionText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#666",
        textAlign: "center",
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "800",
        color: "#1a1a1a",
        marginBottom: 12,
    },
    addLink: {
        fontSize: 14,
        fontWeight: "700",
        color: "#4FD1C5",
        padding: 8,
    },
    servicesGrid: {
        gap: 12,
    },
    serviceCard: {
        flexDirection: "row",
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 16,
        alignItems: "center",
        borderLeftWidth: 4,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    serviceIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    serviceInfo: {
        flex: 1,
    },
    serviceName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1a1a1a",
        marginBottom: 4,
    },
    serviceNumber: {
        fontSize: 18,
        fontWeight: "800",
        color: "#666",
    },
    contactCard: {
        flexDirection: "row",
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: "center",
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    contactIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "rgba(79, 209, 197, 0.1)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16,
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1a1a1a",
        marginBottom: 2,
    },
    contactRelation: {
        fontSize: 13,
        color: "#999",
        marginBottom: 4,
        fontWeight: '500',
    },
    contactNumber: {
        fontSize: 14,
        color: "#666",
    },
    contactActions: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        elevation: 1,
    },
    callAction: {
        backgroundColor: "#4caf50",
    },
    deleteAction: {
        backgroundColor: "#f44336",
    },
    emptyText: {
        textAlign: 'center',
        padding: 20,
        fontStyle: 'italic',
    },

    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 24,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    modalButton: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#eee',
    },
    saveButton: {
        backgroundColor: '#4FD1C5',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },

    // Tip Card
    tipCard: {
        flexDirection: "row",
        backgroundColor: "#fff",
        padding: 20,
        borderRadius: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        alignItems: 'flex-start',
    },
    tipContent: {
        flex: 1,
        marginLeft: 16,
    },
    tipTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1a1a1a",
        marginBottom: 8,
    },
    tipText: {
        fontSize: 14,
        color: "#666",
        lineHeight: 24,
    },
});