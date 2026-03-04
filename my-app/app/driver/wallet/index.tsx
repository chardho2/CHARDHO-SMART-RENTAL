import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { storageService } from '../../../services/storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';

export default function DriverWalletScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [walletData, setWalletData] = useState<any>(null);
    const [transactions, setTransactions] = useState([]);

    const fetchWalletData = async () => {
        try {
            const token = await storageService.getToken();
            if (!token) return;

            // Parallel fetch for speed
            const [summaryRes, historyRes] = await Promise.all([
                axios.get(`${API_URL}/requests/financial-summary`, { // Using existing endpoint or new wallet endpoint
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${API_URL}/wallet/history`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            setWalletData(summaryRes.data.data);
            setTransactions(historyRes.data.transactions || []);
        } catch (error) {
            console.error('Fetch wallet error:', error);
            Alert.alert('Error', 'Failed to load wallet details');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchWalletData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchWalletData();
    };

    const handlePayoutRequest = async () => {
        if (!walletData || walletData.payoutEligibleBalance < 100) {
            Alert.alert('Alert', 'Minimum payout amount is ₹100');
            return;
        }

        try {
            const token = await storageService.getToken();
            // Request full available balance
            const amount = walletData.payoutEligibleBalance;

            await axios.post(`${API_URL}/payment/payout`, { amount }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            Alert.alert('Success', 'Payout initiated successfully!');
            fetchWalletData(); // Refresh to update balance
        } catch (error: any) {
            Alert.alert('Payout Failed', error.response?.data?.message || 'Something went wrong');
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
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <LinearGradient colors={['#1a1a1a', '#2d2d2d']} style={styles.header}>
                <Text style={styles.headerTitle}>My Wallet</Text>
                <Text style={styles.balanceLabel}>Available Balance (70%)</Text>
                <Text style={styles.balanceAmount}>₹{walletData?.payoutEligibleBalance?.toFixed(2) || '0.00'}</Text>

                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Lifetime</Text>
                        <Text style={styles.statValue}>₹{walletData?.walletBalance?.toFixed(2) || '0.00'}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Locked</Text>
                        <Text style={styles.statValue}>₹{walletData?.lockedBalance?.toFixed(2) || '0.00'}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.payoutButton, { opacity: (walletData?.payoutEligibleBalance || 0) < 100 ? 0.6 : 1 }]}
                    onPress={handlePayoutRequest}
                    disabled={(walletData?.payoutEligibleBalance || 0) < 100}
                >
                    <Text style={styles.payoutButtonText}>Request Payout</Text>
                </TouchableOpacity>

                {(walletData?.payoutEligibleBalance || 0) < 100 && (
                    <Text style={styles.minPayoutText}>Min. payout ₹100</Text>
                )}
            </LinearGradient>

            <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/driver/wallet/qr')}>
                    <Ionicons name="qr-code-outline" size={24} color="#333" />
                    <Text style={styles.actionText}>My QR Code</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="document-text-outline" size={24} color="#333" />
                    <Text style={styles.actionText}>Tax Report</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Transactions</Text>
                {transactions.map((txn: any) => (
                    <View key={txn._id} style={styles.transactionItem}>
                        <View style={styles.txnIconCtx}>
                            <Ionicons
                                name={txn.type === 'CREDIT' ? 'arrow-down' : 'arrow-up'}
                                size={20}
                                color={txn.type === 'CREDIT' ? '#4CAF50' : '#F44336'}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.txnTitle}>{txn.description || 'Transaction'}</Text>
                            <Text style={styles.txnDate}>{new Date(txn.createdAt).toLocaleDateString()}</Text>
                        </View>
                        <Text style={[styles.txnAmount, { color: txn.type === 'CREDIT' ? '#4CAF50' : '#333' }]}>
                            {txn.type === 'CREDIT' ? '+' : '-'}₹{txn.amount}
                        </Text>
                    </View>
                ))}
                {transactions.length === 0 && (
                    <Text style={styles.emptyText}>No recent transactions</Text>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { padding: 24, paddingTop: 60, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
    headerTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 20 },
    balanceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
    balanceAmount: { color: '#fff', fontSize: 36, fontWeight: 'bold', marginVertical: 8 },
    statsRow: { flexDirection: 'row', marginTop: 16, justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12 },
    statItem: { alignItems: 'center', flex: 1 },
    statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
    statValue: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 4 },
    payoutButton: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
    payoutButtonText: { color: '#1a1a1a', fontWeight: 'bold', fontSize: 16 },
    minPayoutText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 8, fontSize: 12 },
    actionsContainer: { flexDirection: 'row', padding: 16, gap: 12 },
    actionButton: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
    actionText: { marginTop: 8, color: '#333', fontWeight: '500' },
    section: { padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1a1a1a' },
    transactionItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
    txnIconCtx: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    txnTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
    txnDate: { fontSize: 12, color: '#999', marginTop: 2 },
    txnAmount: { fontSize: 16, fontWeight: 'bold' },
    emptyText: { textAlign: 'center', color: '#999', marginTop: 20 }
});
