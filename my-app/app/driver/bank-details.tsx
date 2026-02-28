import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    ScrollView,
    ActivityIndicator,
    Alert,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { driverAPI, BankDetails } from '../../services/driverAPI';
import { useSettings } from '../../context/SettingsContext';

export default function BankDetailsScreen() {
    const { colors, darkMode } = useSettings();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [details, setDetails] = useState<BankDetails>({
        accountNumber: '',
        ifscCode: '',
        accountHolderName: '',
        verificationStatus: 'pending'
    });

    useEffect(() => {
        fetchBankDetails();
    }, []);

    const fetchBankDetails = async () => {
        try {
            setLoading(true);
            const response = await driverAPI.getBankDetails();
            if (response.success && response.bankDetails) {
                setDetails(response.bankDetails);
            }
        } catch (error) {
            console.error('Error fetching bank details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!details.accountHolderName.trim() || !details.accountNumber.trim() || !details.ifscCode.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
        if (!ifscRegex.test(details.ifscCode.toUpperCase())) {
            Alert.alert('Error', 'Invalid IFSC Code format');
            return;
        }

        try {
            setSubmitting(true);
            const response = await driverAPI.updateBankDetails(details);
            if (response.success) {
                Alert.alert('Success', 'Bank details saved. Please verify them now.', [
                    { text: 'OK' } // Stay on screen to verify
                ]);
            } else {
                Alert.alert('Error', response.message || 'Failed to update details');
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    const handleVerify = async () => {
        try {
            setVerifying(true);
            const response = await driverAPI.verifyBankDetails();
            if (response.success) {
                setDetails(prev => ({ ...prev, verificationStatus: 'verified' }));
                Alert.alert('Success', 'Bank Account Verified Successfully! ✅');
            } else {
                setDetails(prev => ({ ...prev, verificationStatus: 'failed' }));
                Alert.alert('Verification Failed', response.message || 'Could not verify account details.');
            }
        } catch (error: any) {
            setDetails(prev => ({ ...prev, verificationStatus: 'failed' }));
            Alert.alert('Error', error.response?.data?.message || 'Verification failed');
        } finally {
            setVerifying(false);
        }
    };

    const isVerified = details.verificationStatus === 'verified';
    const isFailed = details.verificationStatus === 'failed';

    const dynamicStyles = useMemo(() => ({
        container: { backgroundColor: colors.background },
        card: { backgroundColor: colors.card },
        text: { color: colors.text },
        subText: { color: colors.subText },
        input: {
            backgroundColor: darkMode ? '#1A1A1A' : '#F9F9F9',
            borderColor: darkMode ? '#333' : '#E0E0E0',
            color: isVerified ? '#999' : colors.text
        },
        label: { color: colors.subText }
    }), [colors, darkMode, isVerified]);

    if (loading) {
        return (
            <View style={[styles.loadingContainer, dynamicStyles.container]}>
                <ActivityIndicator size="large" color="#4FD1C5" />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, dynamicStyles.container]}
        >
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
            <LinearGradient
                colors={['#0F2027', '#203A43', '#2C5364']}
                style={styles.header}
            >
                <TouchableOpacity onPress={() => router.replace('/driver/tabs/earnings')} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Bank Details</Text>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Status Badge */}
                <View style={[styles.statusCard,
                isVerified ? styles.statusVerified : isFailed ? styles.statusFailed : styles.statusPending
                ]}>
                    <Ionicons
                        name={isVerified ? "checkmark-circle" : isFailed ? "alert-circle" : "time"}
                        size={24}
                        color="#fff"
                    />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.statusTitle}>
                            {isVerified ? 'Bank Account Verified' : isFailed ? 'Verification Failed' : 'Verification Pending'}
                        </Text>
                        <Text style={styles.statusDesc}>
                            {isVerified
                                ? 'Your account is active for payouts.'
                                : isFailed
                                    ? 'Please check details and try again.'
                                    : 'Verify your account to enable payouts.'}
                        </Text>
                    </View>
                </View>

                <View style={[styles.formCard, dynamicStyles.card]}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Account Holder Name</Text>
                        <TextInput
                            style={[styles.input, dynamicStyles.input]}
                            value={details.accountHolderName}
                            onChangeText={(text) => setDetails({ ...details, accountHolderName: text })}
                            placeholder="Recipient Name"
                            placeholderTextColor="#999"
                            editable={!isVerified}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>Account Number</Text>
                        <TextInput
                            style={[styles.input, dynamicStyles.input]}
                            value={details.accountNumber}
                            onChangeText={(text) => setDetails({ ...details, accountNumber: text })}
                            placeholder="Account Number"
                            placeholderTextColor="#999"
                            keyboardType="numeric"
                            editable={!isVerified}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, dynamicStyles.label]}>IFSC Code</Text>
                        <TextInput
                            style={[styles.input, dynamicStyles.input, { textTransform: 'uppercase' }]}
                            value={details.ifscCode}
                            onChangeText={(text) => setDetails({ ...details, ifscCode: text.toUpperCase() })}
                            placeholder="IFSC Code"
                            placeholderTextColor="#999"
                            autoCapitalize="characters"
                            editable={!isVerified}
                        />
                    </View>
                </View>

                {/* Actions */}
                {!isVerified ? (
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.saveButton, styles.outlineButton, submitting && styles.disabledButton]}
                            onPress={handleSave}
                            disabled={submitting || verifying}
                        >
                            {submitting ? <ActivityIndicator color="#4FD1C5" /> : <Text style={styles.outlineButtonText}>Save Changes</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.saveButton, (verifying || !details.accountNumber) && styles.disabledButton]}
                            onPress={handleVerify}
                            disabled={verifying || !details.accountNumber}
                        >
                            {verifying ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="shield-checkmark" size={20} color="#fff" style={{ marginRight: 8 }} />
                                    <Text style={styles.saveButtonText}>Verify Now</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.securityInfo}>
                        <MaterialCommunityIcons name="lock-check" size={20} color="#4FD1C5" />
                        <Text style={styles.securityText}>Details are locked for security.</Text>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: 20,
    },
    backButton: {
        marginRight: 16,
        padding: 4,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
    },
    scrollContent: {
        padding: 20,
    },
    infoCard: {
        flexDirection: 'row',
        backgroundColor: 'rgba(79, 209, 197, 0.1)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#2C5364',
        lineHeight: 20,
    },
    formCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    saveButton: {
        backgroundColor: '#4FD1C5',
        flex: 1,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    disabledButton: {
        opacity: 0.5,
        backgroundColor: '#A0E7E0',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    securityInfo: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        gap: 6,
    },
    securityText: {
        fontSize: 12,
        color: '#4FD1C5',
        fontWeight: '500',
    },
    statusCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        alignItems: 'flex-start',
        borderWidth: 1,
        gap: 12,
    },
    statusVerified: {
        backgroundColor: 'rgba(79, 209, 197, 0.1)',
        borderColor: 'rgba(79, 209, 197, 0.3)',
    },
    statusPending: {
        backgroundColor: 'rgba(255, 165, 0, 0.1)',
        borderColor: 'rgba(255, 165, 0, 0.3)',
    },
    statusFailed: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    statusTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    statusDesc: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: 20,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 10,
        paddingHorizontal: 0,
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#4FD1C5',
        flex: 1,
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 0,
        shadowOpacity: 0,
    },
    outlineButtonText: {
        color: '#4FD1C5',
        fontSize: 16,
        fontWeight: '700',
    },
});
