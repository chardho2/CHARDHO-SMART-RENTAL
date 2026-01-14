import React, { useState, useEffect, useCallback } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
    StatusBar,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { statsAPI } from "../../../services/statsAPI";
import driverAPI, { Transaction, BankDetails } from "../../../services/driverAPI";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import EmptyState from "../../../components/common/EmptyState";
import { router } from "expo-router";
import { useSettings } from "../../../context/SettingsContext";

const { width } = Dimensions.get("window");

interface EarningsState {
    walletBalance: number;
    payoutEligibleBalance: number;
    lockedBalance: number;
    currency: string;
    nextPayoutEstimation: string;
    recentTransactions: Transaction[];
    minPayoutThreshold: number;
}

export default function DriverEarnings() {
    const { colors, darkMode } = useSettings();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<EarningsState>({
        walletBalance: 0,
        payoutEligibleBalance: 0,
        lockedBalance: 0,
        currency: 'INR',
        nextPayoutEstimation: '',
        recentTransactions: [],
        minPayoutThreshold: 100
    });
    const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            await Promise.all([
                fetchSummary(),
                fetchBankDetails()
            ]);
        } catch (error) {
            console.error("Error loading earnings page:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        try {
            const response = await driverAPI.getFinancialSummary();
            if (response.success && response.data) {
                setData({
                    walletBalance: response.data.walletBalance,
                    payoutEligibleBalance: response.data.payoutEligibleBalance,
                    lockedBalance: response.data.lockedBalance,
                    currency: response.data.currency,
                    nextPayoutEstimation: response.data.nextPayoutEstimation,
                    recentTransactions: response.data.recentTransactions,
                    minPayoutThreshold: response.data.minPayoutThreshold
                });
            }
        } catch (error) {
            console.log("Summary fetch error", error);
        }
    };

    const fetchBankDetails = async () => {
        try {
            const response = await driverAPI.getBankDetails();
            if (response.success && response.bankDetails && response.bankDetails.accountNumber) {
                setBankDetails(response.bankDetails);
            } else {
                setBankDetails(null);
            }
        } catch (error) {
            console.log("Bank details fetch error", error);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([fetchSummary(), fetchBankDetails()]);
        setRefreshing(false);
    }, []);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getTransactionIcon = (type: string, status?: string) => {
        if (type === 'earning' || type === 'ride_earning') {
            return status === 'locked' ? 'time' : 'cash';
        }
        if (type === 'payout') return 'wallet';
        return 'cash';
    };

    const dynamicStyles = {
        container: { backgroundColor: colors.background },
        text: { color: colors.text },
        subText: { color: colors.subText },
        card: { backgroundColor: colors.card },
        sectionTitle: { color: colors.text },
        payoutCard: { backgroundColor: colors.card, borderColor: colors.border },
    };

    if (loading && !refreshing) {
        return <LoadingSpinner text="Loading earnings..." />;
    }

    const canPayout = data.payoutEligibleBalance >= data.minPayoutThreshold;

    return (
        <View style={[styles.container, dynamicStyles.container]}>
            <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />
            <LinearGradient
                colors={['#0F2027', '#203A43', '#2C5364']}
                style={styles.headerBackground}
            >
                <View style={styles.headerContent}>
                    <Text style={styles.title}>Earnings</Text>
                    <Text style={styles.subtitle}>Payouts processed daily</Text>
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4FD1C5"]} tintColor="#4FD1C5" />
                }
            >
                {/* Balance Card */}
                <TouchableOpacity
                    style={styles.totalCard}
                    onPress={() => router.push('/driver/wallet')}
                    activeOpacity={0.9}
                >
                    <LinearGradient
                        colors={['#4FD1C5', '#38B2AC']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.totalCardGradient}
                    >
                        <View>
                            <Text style={styles.totalLabel}>Total Balance</Text>
                            <Text style={styles.totalAmount}>₹{data.walletBalance.toFixed(2)}</Text>
                        </View>

                        <View style={styles.splitBalanceRow}>
                            <View style={[styles.splitItem, styles.splitItemBorder]}>
                                <Text style={styles.splitLabel}>Available for Payout</Text>
                                <View style={styles.splitValueRow}>
                                    <View style={styles.indicatorGreen} />
                                    <Text style={styles.splitValue}>₹{data.payoutEligibleBalance.toFixed(2)}</Text>
                                </View>
                            </View>
                            <View style={styles.splitItem}>
                                <Text style={styles.splitLabel}>Processing (24h)</Text>
                                <View style={styles.splitValueRow}>
                                    <View style={styles.indicatorOrange} />
                                    <Text style={styles.splitValue}>₹{data.lockedBalance.toFixed(2)}</Text>
                                </View>
                            </View>
                        </View>

                        <View style={{ position: 'absolute', top: 24, right: 24 }}>
                            <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.8)" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Payout Status */}
                <View style={styles.section}>
                    <View style={[styles.payoutStatusCard, dynamicStyles.card]}>
                        <View style={styles.payoutHeader}>
                            <Text style={[styles.sectionTitle, dynamicStyles.text]}>Next Payout</Text>
                            {canPayout ? (
                                <View style={styles.badgeGreen}><Text style={styles.badgeTextGreen}>Eligible</Text></View>
                            ) : (
                                <View style={styles.badgeGray}><Text style={styles.badgeTextGray}>Pending</Text></View>
                            )}
                        </View>

                        <Text style={[styles.payoutMsg, dynamicStyles.subText]}>
                            {canPayout
                                ? `₹${data.payoutEligibleBalance} will be sent to your bank automatically tomorrow.`
                                : `Minimum ₹${data.minPayoutThreshold} needed for automated payout.`
                            }
                        </Text>
                        {data.payoutEligibleBalance > 0 && !canPayout && (
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${(data.payoutEligibleBalance / data.minPayoutThreshold) * 100}%` }]} />
                            </View>
                        )}
                    </View>
                </View>

                {/* Transactions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.text, { marginBottom: 12 }]}>Recent Transactions</Text>

                    {data.recentTransactions.length === 0 ? (
                        <EmptyState icon="receipt-outline" title="No Transactions" message="Ride earnings will appear here" />
                    ) : (
                        data.recentTransactions.map((tx, index) => (
                            <View key={tx._id || `transaction-${index}`} style={[styles.transactionCard, dynamicStyles.card]}>
                                <View style={[styles.transactionIcon, { backgroundColor: tx.type === 'payout' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(76, 175, 80, 0.1)' }]}>
                                    <Ionicons
                                        name={getTransactionIcon(tx.type, tx.status) as any}
                                        size={24}
                                        color={tx.type === 'payout' ? '#2196f3' : '#4caf50'}
                                    />
                                </View>
                                <View style={styles.transactionInfo}>
                                    <Text style={[styles.transactionDesc, dynamicStyles.text]}>{tx.description}</Text>
                                    <Text style={[styles.transactionDate, dynamicStyles.subText]}>{formatDate(tx.date)}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={[styles.transactionAmount, { color: tx.type === 'payout' ? '#333' : '#4caf50' }]}>
                                        {tx.type === 'payout' ? '-' : '+'}₹{tx.amount}
                                    </Text>
                                    {tx.status === 'locked' && (
                                        <Text style={{ fontSize: 10, color: '#f59e0b', fontWeight: '600' }}>Processing</Text>
                                    )}
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Bank Method */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.text, { marginBottom: 12 }]}>Payout Method</Text>
                    {bankDetails ? (
                        <TouchableOpacity
                            style={[styles.payoutCard, dynamicStyles.payoutCard]}
                            onPress={() => router.push('/driver/bank-details')}
                        >
                            <View style={styles.bankIcon}>
                                <MaterialCommunityIcons name="bank" size={24} color="#4FD1C5" />
                            </View>
                            <View style={styles.payoutInfo}>
                                <Text style={[styles.payoutName, dynamicStyles.text]}>{bankDetails.accountHolderName}</Text>
                                <Text style={[styles.payoutBankDetails, dynamicStyles.subText]}>
                                    •••• {bankDetails.accountNumber.slice(-4)}
                                </Text>
                            </View>
                            {bankDetails.verificationStatus === 'verified' && (
                                <Ionicons name="checkmark-circle" size={20} color="#4caf50" />
                            )}
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.addPayoutBtn, dynamicStyles.card, { borderColor: '#4FD1C5' }]}
                            onPress={() => router.push('/driver/bank-details')}
                        >
                            <Ionicons name="add-circle-outline" size={24} color="#4FD1C5" />
                            <Text style={styles.addPayoutText}>Link Bank Account</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f7f7f6" },
    headerBackground: { paddingTop: 60, paddingBottom: 80, paddingHorizontal: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerContent: { marginBottom: 10 },
    title: { fontSize: 32, fontWeight: "900", color: "#ffffff", marginBottom: 4 },
    subtitle: { fontSize: 14, color: "rgba(255, 255, 255, 0.8)", fontWeight: '500' },
    scrollView: { flex: 1, marginTop: -60 },
    scrollContent: { paddingBottom: 24 },
    totalCard: { marginHorizontal: 16, marginBottom: 20, borderRadius: 20, elevation: 8, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
    totalCardGradient: { padding: 24, borderRadius: 20 },
    totalLabel: { fontSize: 14, color: "rgba(255,255,255,0.9)", marginBottom: 4, fontWeight: "600" },
    totalAmount: { fontSize: 36, fontWeight: "800", color: "#fff", marginBottom: 24 },

    splitBalanceRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12 },
    splitItem: { flex: 1, alignItems: 'flex-start', paddingHorizontal: 8 },
    splitItemBorder: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)' },
    splitLabel: { fontSize: 11, color: "rgba(255,255,255,0.8)", marginBottom: 4 },
    splitValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    splitValue: { fontSize: 16, fontWeight: '700', color: '#fff' },
    indicatorGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4caf50', borderWidth: 1, borderColor: '#fff' },
    indicatorOrange: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f59e0b', borderWidth: 1, borderColor: '#fff' },

    section: { paddingHorizontal: 16, marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1a1a1a" },

    payoutStatusCard: { padding: 16, borderRadius: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
    payoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    payoutMsg: { fontSize: 14, color: '#666', lineHeight: 20 },
    badgeGreen: { backgroundColor: 'rgba(76, 175, 80, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeTextGreen: { color: '#4caf50', fontSize: 12, fontWeight: '700' },
    badgeGray: { backgroundColor: 'rgba(150, 150, 150, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeTextGray: { color: '#666', fontSize: 12, fontWeight: '700' },
    progressBarBg: { height: 6, backgroundColor: '#f0f0f0', borderRadius: 3, marginTop: 12, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: '#4FD1C5', borderRadius: 3 },

    transactionCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, marginBottom: 12, elevation: 1, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
    transactionIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center", marginRight: 16 },
    transactionInfo: { flex: 1 },
    transactionDesc: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
    transactionDate: { fontSize: 12, color: "#999" },
    transactionAmount: { fontSize: 16, fontWeight: "700" },

    payoutCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "#f0f0f0" },
    bankIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(79, 209, 197, 0.1)", justifyContent: "center", alignItems: "center", marginRight: 12 },
    payoutInfo: { flex: 1 },
    payoutName: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
    payoutBankDetails: { fontSize: 13, color: "#666", fontFamily: 'monospace' },
    addPayoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 16, gap: 8, borderWidth: 2, borderStyle: "dashed" },
    addPayoutText: { fontSize: 15, fontWeight: "600", color: "#4FD1C5" },
});
