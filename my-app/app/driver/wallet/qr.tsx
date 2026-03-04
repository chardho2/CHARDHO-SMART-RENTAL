import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Share } from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

import { getBaseUrl } from '../../../services/api';
import { storageService } from '../../../services/storage';

export default function DriverQRScreen() {
    const [loading, setLoading] = useState(true);
    const [qrData, setQrData] = useState<any>(null);

    useEffect(() => {
        fetchQR();
    }, []);

    const fetchQR = async () => {
        try {
            const token = await storageService.getToken();
            const baseUrl = getBaseUrl();
            const response = await axios.get(`${baseUrl}/payment/qr`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQrData(response.data);
        } catch (error) {
            console.error('QR Fetch Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (!qrData?.qrContent) return;
        try {
            await Share.share({
                message: `Pay me on Chardhogo: ${qrData.qrContent}`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#000" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'My Payment QR', headerBackTitle: 'Wallet' }} />

            <View style={styles.card}>
                <View style={styles.header}>
                    <Image
                        source={{ uri: 'https://via.placeholder.com/100' }}
                        style={styles.logo}
                    />
                    <Text style={styles.appName}>Chardhogo Driver</Text>
                </View>

                <View style={styles.qrContainer}>
                    {qrData?.qrImage ? (
                        <Image source={{ uri: qrData.qrImage }} style={styles.qrImage} />
                    ) : (
                        <Text>Failed to load QR</Text>
                    )}
                </View>

                <Text style={styles.instruction}>Scan to Pay</Text>
                <Text style={styles.subInstruction}>Accepts UPI, Cards & Wallets</Text>
            </View>

            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                <Ionicons name="share-social-outline" size={24} color="#fff" />
                <Text style={styles.shareText}>Share Payment Link</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa', padding: 20, justifyContent: 'center' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: '#fff', borderRadius: 24, padding: 30, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    header: { alignItems: 'center', marginBottom: 30 },
    logo: { width: 60, height: 60, borderRadius: 12, marginBottom: 12, backgroundColor: '#eee' },
    appName: { fontSize: 18, fontWeight: 'bold', color: '#1a1a1a' },
    qrContainer: { padding: 20, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#eee' },
    qrImage: { width: 220, height: 220 },
    instruction: { fontSize: 24, fontWeight: 'bold', marginTop: 30, color: '#1a1a1a' },
    subInstruction: { fontSize: 14, color: '#666', marginTop: 8 },
    shareButton: { flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 18, alignItems: 'center', justifyContent: 'center', marginTop: 30, gap: 10 },
    shareText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
