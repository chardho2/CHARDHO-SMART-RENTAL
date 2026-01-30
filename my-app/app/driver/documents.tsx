import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import driverAPI from '../../services/driverAPI';
import * as DocumentPicker from 'expo-document-picker';

interface DocumentStatus {
    license: string | null;
    aadhar: string | null;
    vehicleRC: string | null;
}

export default function Documents() {
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [documents, setDocuments] = useState<DocumentStatus>({
        license: null,
        aadhar: null,
        vehicleRC: null,
    });

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const response = await driverAPI.getProfile();
            if (response.success && response.driver?.documents) {
                setDocuments({
                    license: response.driver.documents.license || null,
                    aadhar: response.driver.documents.aadhar || null,
                    vehicleRC: response.driver.documents.vehicleRC || null,
                });
            }
        } catch (error) {
            console.error('Error loading documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const pickDocument = async (type: 'license' | 'aadhar' | 'vehicleRC') => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf'],
                copyToCacheDirectory: true,
            });

            if (result.canceled) {
                return;
            }

            // For now, we'll just store the URI
            // In production, you'd upload to a server
            const uri = result.assets[0].uri;

            setUploading(type);

            // Simulate upload delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Update local state
            setDocuments(prev => ({
                ...prev,
                [type]: uri,
            }));

            // Save to backend
            await driverAPI.updateProfile({
                documents: {
                    license: documents.license || '',
                    aadhar: documents.aadhar || '',
                    vehicleRC: documents.vehicleRC || '',
                    [type]: uri,
                },
            });

            Alert.alert('Success', 'Document uploaded successfully');
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'Failed to upload document');
        } finally {
            setUploading(null);
        }
    };

    const removeDocument = async (type: 'license' | 'aadhar' | 'vehicleRC') => {
        Alert.alert(
            'Remove Document',
            'Are you sure you want to remove this document?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setDocuments(prev => ({
                                ...prev,
                                [type]: null,
                            }));

                            await driverAPI.updateProfile({
                                documents: {
                                    license: documents.license || '',
                                    aadhar: documents.aadhar || '',
                                    vehicleRC: documents.vehicleRC || '',
                                    [type]: '',
                                },
                            });

                            Alert.alert('Success', 'Document removed');
                        } catch (error) {
                            console.error('Error removing document:', error);
                            Alert.alert('Error', 'Failed to remove document');
                        }
                    },
                },
            ]
        );
    };

    const getDocumentLabel = (type: string) => {
        switch (type) {
            case 'license':
                return 'Driving License';
            case 'aadhar':
                return 'Aadhar Card';
            case 'vehicleRC':
                return 'Vehicle RC';
            default:
                return '';
        }
    };

    const getDocumentIcon = (type: string) => {
        switch (type) {
            case 'license':
                return 'card';
            case 'aadhar':
                return 'finger-print';
            case 'vehicleRC':
                return 'document-text';
            default:
                return 'document';
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
                <Text style={styles.headerTitle}>Documents</Text>
            </LinearGradient>

            <ScrollView style={styles.content}>
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle" size={24} color="#4FD1C5" />
                    <Text style={styles.infoText}>
                        Upload clear photos or PDFs of your documents. All documents are required for verification.
                    </Text>
                </View>

                {(['license', 'aadhar', 'vehicleRC'] as const).map((type) => (
                    <View key={type} style={styles.documentCard}>
                        <View style={styles.documentHeader}>
                            <View style={styles.documentTitleRow}>
                                <Ionicons
                                    name={getDocumentIcon(type) as any}
                                    size={24}
                                    color={documents[type] ? '#4caf50' : '#666'}
                                />
                                <Text style={styles.documentTitle}>{getDocumentLabel(type)}</Text>
                            </View>
                            {documents[type] && (
                                <View style={styles.statusBadge}>
                                    <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
                                    <Text style={styles.statusText}>Uploaded</Text>
                                </View>
                            )}
                        </View>

                        {documents[type] ? (
                            <View style={styles.documentActions}>
                                <TouchableOpacity
                                    style={styles.viewButton}
                                    onPress={() => Alert.alert('Document', 'Document viewing will be implemented')}
                                >
                                    <Ionicons name="eye-outline" size={18} color="#4FD1C5" />
                                    <Text style={styles.viewButtonText}>View</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => removeDocument(type)}
                                >
                                    <Ionicons name="trash-outline" size={18} color="#f44336" />
                                    <Text style={styles.removeButtonText}>Remove</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.uploadButton}
                                onPress={() => pickDocument(type)}
                                disabled={uploading === type}
                            >
                                {uploading === type ? (
                                    <ActivityIndicator color="#4FD1C5" size="small" />
                                ) : (
                                    <>
                                        <Ionicons name="cloud-upload-outline" size={20} color="#4FD1C5" />
                                        <Text style={styles.uploadButtonText}>Upload Document</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                ))}

                <View style={styles.noteCard}>
                    <Text style={styles.noteTitle}>📝 Important Notes:</Text>
                    <Text style={styles.noteText}>• Documents should be clear and readable</Text>
                    <Text style={styles.noteText}>• Accepted formats: JPG, PNG, PDF</Text>
                    <Text style={styles.noteText}>• Maximum file size: 5MB</Text>
                    <Text style={styles.noteText}>• Verification may take 24-48 hours</Text>
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
    infoCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(79, 209, 197, 0.1)',
        margin: 20,
        padding: 16,
        borderRadius: 12,
        gap: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#4FD1C5',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#1a1a1a',
        lineHeight: 20,
    },
    documentCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 20,
        borderRadius: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    documentHeader: {
        marginBottom: 16,
    },
    documentTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    documentTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1a1a1a',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4caf50',
    },
    documentActions: {
        flexDirection: 'row',
        gap: 12,
    },
    viewButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: 'rgba(79, 209, 197, 0.1)',
        gap: 6,
    },
    viewButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4FD1C5',
    },
    removeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        gap: 6,
    },
    removeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#f44336',
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#4FD1C5',
        borderStyle: 'dashed',
        gap: 8,
    },
    uploadButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4FD1C5',
    },
    noteCard: {
        backgroundColor: '#fff9e6',
        margin: 20,
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#ff9800',
    },
    noteTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
    },
    noteText: {
        fontSize: 13,
        color: '#666',
        marginBottom: 4,
        lineHeight: 20,
    },
});
