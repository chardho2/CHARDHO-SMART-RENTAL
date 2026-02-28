import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import driverAPI from '../../services/driverAPI';

const VEHICLE_TYPES = ['bike', 'auto', 'car', 'suv'];

export default function EditVehicle() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        type: 'bike',
        model: '',
        plateNumber: '',
        color: '',
        year: new Date().getFullYear().toString(),
    });

    useEffect(() => {
        loadVehicle();
    }, []);

    const loadVehicle = async () => {
        try {
            const response = await driverAPI.getProfile();
            if (response.success && response.driver?.vehicle) {
                const vehicle = response.driver.vehicle;
                setFormData({
                    type: vehicle.type || 'bike',
                    model: vehicle.model || '',
                    plateNumber: vehicle.plateNumber || '',
                    color: vehicle.color || '',
                    year: vehicle.year?.toString() || new Date().getFullYear().toString(),
                });
            }
        } catch (error) {
            console.error('Error loading vehicle:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.model.trim()) {
            Alert.alert('Error', 'Vehicle model is required');
            return;
        }

        if (!formData.plateNumber.trim()) {
            Alert.alert('Error', 'Plate number is required');
            return;
        }

        if (!formData.color.trim()) {
            Alert.alert('Error', 'Vehicle color is required');
            return;
        }

        try {
            setSaving(true);
            const response = await driverAPI.updateProfile({
                vehicle: {
                    ...formData,
                    year: parseInt(formData.year) || new Date().getFullYear(),
                },
            });

            if (response.success) {
                Alert.alert('Success', 'Vehicle details updated successfully', [
                    { text: 'OK', onPress: () => router.back() }
                ]);
            } else {
                Alert.alert('Error', response.message || 'Failed to update vehicle');
            }
        } catch (error: any) {
            console.error('Error saving vehicle:', error);
            Alert.alert('Error', error.response?.data?.message || 'Failed to update vehicle');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4FD1C5" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0F2027', '#203A43', '#2C5364']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Vehicle Details</Text>
            </LinearGradient>

            <ScrollView style={styles.content}>
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Vehicle Type *</Text>
                        <View style={styles.typeGrid}>
                            {VEHICLE_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.typeButton,
                                        formData.type === type && styles.typeButtonActive,
                                    ]}
                                    onPress={() => setFormData({ ...formData, type })}
                                >
                                    <Text
                                        style={[
                                            styles.typeButtonText,
                                            formData.type === type && styles.typeButtonTextActive,
                                        ]}
                                    >
                                        {type.toUpperCase()}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Vehicle Model *</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="car-sport-outline" size={20} color="#666" />
                            <TextInput
                                style={styles.input}
                                value={formData.model}
                                onChangeText={(text) => setFormData({ ...formData, model: text })}
                                placeholder="e.g., Hero Splendor, Maruti Swift"
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Plate Number *</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="document-text-outline" size={20} color="#666" />
                            <TextInput
                                style={styles.input}
                                value={formData.plateNumber}
                                onChangeText={(text) => setFormData({ ...formData, plateNumber: text.toUpperCase() })}
                                placeholder="e.g., AP-02-XY-1234"
                                placeholderTextColor="#999"
                                autoCapitalize="characters"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Color *</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="color-palette-outline" size={20} color="#666" />
                            <TextInput
                                style={styles.input}
                                value={formData.color}
                                onChangeText={(text) => setFormData({ ...formData, color: text })}
                                placeholder="e.g., Black, White, Red"
                                placeholderTextColor="#999"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Year</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="calendar-outline" size={20} color="#666" />
                            <TextInput
                                style={styles.input}
                                value={formData.year}
                                onChangeText={(text) => setFormData({ ...formData, year: text })}
                                placeholder="e.g., 2020"
                                placeholderTextColor="#999"
                                keyboardType="number-pad"
                                maxLength={4}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        <LinearGradient
                            colors={saving ? ['#ccc', '#aaa'] : ['#4FD1C5', '#38B2AC']}
                            style={styles.saveButtonGradient}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                                    <Text style={styles.saveButtonText}>Save Vehicle Details</Text>
                                </>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f7f6',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f7f7f6',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
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
    content: {
        flex: 1,
    },
    form: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    typeButton: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#e0e0e0',
    },
    typeButtonActive: {
        borderColor: '#4FD1C5',
        backgroundColor: 'rgba(79, 209, 197, 0.1)',
    },
    typeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    typeButtonTextActive: {
        color: '#4FD1C5',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        paddingLeft: 12,
        fontSize: 15,
        color: '#1a1a1a',
    },
    saveButton: {
        marginTop: 20,
        borderRadius: 12,
        overflow: 'hidden',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
    },
});
