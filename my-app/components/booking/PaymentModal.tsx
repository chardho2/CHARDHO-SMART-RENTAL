import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    Alert,
} from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface PaymentModalProps {
    visible: boolean;
    amount: number;
    onSubmit: (method: string) => Promise<void>;
}

export default function PaymentModal({ visible, amount, onSubmit }: PaymentModalProps) {
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const paymentMethods = [
        { id: 'phonepe', name: 'PhonePe', icon: 'mobile-alt', color: '#5f259f' },
        { id: 'gpay', name: 'Google Pay', icon: 'google', color: '#4285F4' },
        { id: 'paytm', name: 'Paytm', icon: 'wallet', color: '#002E6E' },
        { id: 'cash', name: 'Cash', icon: 'money-bill-wave', color: '#4CAF50' },
    ];

    const handleConfirm = async () => {
        if (!selectedMethod) {
            Alert.alert('Select Payment', 'Please select a payment method to continue.');
            return;
        }

        setProcessing(true);
        // Simulate processing for online methods
        if (selectedMethod !== 'cash') {
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        await onSubmit(selectedMethod);
        setProcessing(false);
        setSelectedMethod(null);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={() => { }} // Prevent closing via back button until paid
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <LinearGradient
                        colors={['#4FD1C5', '#38B2AC']}
                        style={styles.header}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <MaterialIcons name="payment" size={40} color="#fff" />
                        <Text style={styles.headerTitle}>Total Fare</Text>
                        <Text style={styles.amountText}>₹{Math.round(amount)}</Text>
                    </LinearGradient>

                    {/* Content */}
                    <View style={styles.content}>
                        <Text style={styles.sectionTitle}>Select Payment Method</Text>

                        {paymentMethods.map((method) => (
                            <TouchableOpacity
                                key={method.id}
                                style={[
                                    styles.methodCard,
                                    selectedMethod === method.id && styles.selectedMethod
                                ]}
                                onPress={() => setSelectedMethod(method.id)}
                                disabled={processing}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: selectedMethod === method.id ? method.color : '#f0f0f0' }]}>
                                    <FontAwesome5
                                        name={method.icon}
                                        size={20}
                                        color={selectedMethod === method.id ? '#fff' : '#666'}
                                    />
                                </View>
                                <Text style={styles.methodName}>{method.name}</Text>
                                {selectedMethod === method.id && (
                                    <MaterialIcons name="check-circle" size={24} color="#4FD1C5" />
                                )}
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity
                            style={[
                                styles.payButton,
                                !selectedMethod && styles.payButtonDisabled
                            ]}
                            onPress={handleConfirm}
                            disabled={!selectedMethod || processing}
                        >
                            <Text style={styles.payButtonText}>
                                {processing ? 'Processing...' : `Pay ₹${Math.round(amount)}`}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
        maxHeight: '80%',
    },
    header: {
        padding: 24,
        alignItems: 'center',
        paddingBottom: 32,
    },
    headerTitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 8,
        fontWeight: '600',
    },
    amountText: {
        fontSize: 40,
        fontWeight: '800',
        color: '#fff',
        marginTop: 4,
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
        marginBottom: 16,
    },
    methodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#eee',
    },
    selectedMethod: {
        borderColor: '#4FD1C5',
        backgroundColor: '#F0FDFA',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    methodName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    payButton: {
        backgroundColor: '#4FD1C5',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
        shadowColor: '#4FD1C5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    payButtonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    payButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '800',
    },
});
