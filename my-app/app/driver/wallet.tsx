import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Modal,
    Alert
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { walletAPI, WalletDetails, WalletTransaction, WalletStats } from '../../services/walletAPI';
import { useSettings } from '../../context/SettingsContext';

export default function DriverWallet() {
    const { colors: theme } = useSettings();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [wallet, setWallet] = useState<WalletDetails | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [stats, setStats] = useState<WalletStats | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'all'>('all');
    const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');

    const fetchWalletData = async () => {
        try {
            const [walletRes, transactionsRes, statsRes] = await Promise.all([
                walletAPI.getDetails(),
                walletAPI.getTransactions({ page: 1, limit: 20 }),
                walletAPI.getStats(selectedPeriod)
            ]);

            if (walletRes.success) {
                setWallet(walletRes.wallet);
            }

            if (transactionsRes.success) {
                setTransactions(transactionsRes.transactions);
            }

            if (statsRes.success) {
                setStats(statsRes.stats);
            }
        } catch (error) {
            console.error('Fetch wallet data error:', error);
            Alert.alert('Error', 'Failed to load wallet data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchWalletData();
    }, [selectedPeriod]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchWalletData();
    }, [selectedPeriod]);

    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount);

        if (!amount || amount <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid amount');
            return;
        }

        if (!wallet) return;

        if (amount > wallet.availableBalance) {
            Alert.alert('Insufficient Balance', 'You don\'t have enough available balance');
            return;
        }

        if (amount < 100) {
            Alert.alert('Minimum Amount', 'Minimum withdrawal amount is ₹100');
            return;
        }

        try {
            const response = await walletAPI.requestWithdrawal(amount);

            if (response.success) {
                Alert.alert('Success', 'Withdrawal request submitted successfully');
                setWithdrawModalVisible(false);
                setWithdrawAmount('');
                fetchWalletData();
            }
        } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to process withdrawal');
        }
    };

    const formatCurrency = (amount: number | undefined | null) => {
        if (amount === undefined || amount === null || isNaN(amount)) {
            return '₹0.00';
        }
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>My Wallet</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Balance Card */}
                <View style={[styles.balanceCard, { backgroundColor: theme.card }]}>
                    <Text style={[styles.balanceLabel, { color: theme.subText }]}>
                        Total Balance
                    </Text>
                    <Text style={[styles.balanceAmount, { color: theme.text }]}>
                        {wallet ? formatCurrency(wallet.totalBalance) : '₹0.00'}
                    </Text>

                    <View style={styles.balanceBreakdown}>
                        <View style={styles.balanceItem}>
                            <View style={[styles.balanceIcon, { backgroundColor: '#10B981' + '20' }]}>
                                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                            </View>
                            <View>
                                <Text style={[styles.balanceItemLabel, { color: theme.subText }]}>
                                    Available
                                </Text>
                                <Text style={[styles.balanceItemAmount, { color: theme.text }]}>
                                    {wallet ? formatCurrency(wallet.availableBalance) : '₹0.00'}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.balanceItem}>
                            <View style={[styles.balanceIcon, { backgroundColor: '#F59E0B' + '20' }]}>
                                <Ionicons name="time" size={20} color="#F59E0B" />
                            </View>
                            <View>
                                <Text style={[styles.balanceItemLabel, { color: theme.subText }]}>
                                    Processing
                                </Text>
                                <Text style={[styles.balanceItemAmount, { color: theme.text }]}>
                                    {wallet ? formatCurrency(wallet.lockedBalance) : '₹0.00'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.withdrawButton, { backgroundColor: theme.primary }]}
                        onPress={() => setWithdrawModalVisible(true)}
                        disabled={!wallet || wallet.availableBalance < 100}
                    >
                        <Ionicons name="cash-outline" size={20} color="#fff" />
                        <Text style={styles.withdrawButtonText}>Withdraw Money</Text>
                    </TouchableOpacity>
                </View>

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
                        <Ionicons name="trending-up" size={24} color="#10B981" />
                        <Text style={[styles.statValue, { color: theme.text }]}>
                            {wallet ? formatCurrency(wallet.lifetimeEarnings) : '₹0.00'}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.subText }]}>
                            Lifetime Earnings
                        </Text>
                    </View>

                    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
                        <Ionicons name="arrow-down-circle" size={24} color="#3B82F6" />
                        <Text style={[styles.statValue, { color: theme.text }]}>
                            {wallet ? formatCurrency(wallet.totalWithdrawn) : '₹0.00'}
                        </Text>
                        <Text style={[styles.statLabel, { color: theme.subText }]}>
                            Total Withdrawn
                        </Text>
                    </View>
                </View>

                {/* Period Selector */}
                <View style={styles.periodSelector}>
                    {(['today', 'week', 'month', 'all'] as const).map((period) => (
                        <TouchableOpacity
                            key={period}
                            style={[
                                styles.periodButton,
                                selectedPeriod === period && { backgroundColor: theme.primary }
                            ]}
                            onPress={() => setSelectedPeriod(period)}
                        >
                            <Text
                                style={[
                                    styles.periodButtonText,
                                    { color: selectedPeriod === period ? '#fff' : theme.subText }
                                ]}
                            >
                                {period.charAt(0).toUpperCase() + period.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Transactions */}
                <View style={styles.transactionsSection}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Recent Transactions
                    </Text>

                    {transactions.length === 0 ? (
                        <View style={[styles.emptyState, { backgroundColor: theme.card }]}>
                            <Ionicons name="wallet-outline" size={48} color={theme.subText} />
                            <Text style={[styles.emptyStateText, { color: theme.subText }]}>
                                No transactions yet
                            </Text>
                        </View>
                    ) : (
                        transactions.map((transaction) => (
                            <View
                                key={transaction._id}
                                style={[styles.transactionItem, { backgroundColor: theme.card }]}
                            >
                                <View style={[
                                    styles.transactionIcon,
                                    { backgroundColor: transaction.type === 'credit' ? '#10B981' + '20' : '#EF4444' + '20' }
                                ]}>
                                    <Ionicons
                                        name={transaction.type === 'credit' ? 'arrow-down' : 'arrow-up'}
                                        size={20}
                                        color={transaction.type === 'credit' ? '#10B981' : '#EF4444'}
                                    />
                                </View>

                                <View style={styles.transactionDetails}>
                                    <Text style={[styles.transactionDescription, { color: theme.text }]}>
                                        {transaction.description}
                                    </Text>
                                    <Text style={[styles.transactionDate, { color: theme.subText }]}>
                                        {formatDate(transaction.createdAt)}
                                    </Text>
                                </View>

                                <View style={styles.transactionRight}>
                                    <Text
                                        style={[
                                            styles.transactionAmount,
                                            { color: transaction.type === 'credit' ? '#10B981' : '#EF4444' }
                                        ]}
                                    >
                                        {transaction.type === 'credit' ? '+' : '-'}
                                        {formatCurrency(transaction.amount)}
                                    </Text>
                                    <View style={[
                                        styles.statusBadge,
                                        {
                                            backgroundColor: transaction.status === 'completed'
                                                ? '#10B981' + '20'
                                                : transaction.status === 'pending'
                                                    ? '#F59E0B' + '20'
                                                    : '#EF4444' + '20'
                                        }
                                    ]}>
                                        <Text
                                            style={[
                                                styles.statusText,
                                                {
                                                    color: transaction.status === 'completed'
                                                        ? '#10B981'
                                                        : transaction.status === 'pending'
                                                            ? '#F59E0B'
                                                            : '#EF4444'
                                                }
                                            ]}
                                        >
                                            {transaction.status}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Withdrawal Modal */}
            <Modal
                visible={withdrawModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setWithdrawModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            Withdraw Money
                        </Text>

                        <Text style={[styles.modalSubtitle, { color: theme.subText }]}>
                            Available Balance: {wallet ? formatCurrency(wallet.availableBalance) : '₹0.00'}
                        </Text>

                        <TextInput
                            style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                            placeholder="Enter amount"
                            placeholderTextColor={theme.subText}
                            keyboardType="numeric"
                            value={withdrawAmount}
                            onChangeText={setWithdrawAmount}
                        />

                        <Text style={[styles.minAmountText, { color: theme.subText }]}>
                            Minimum withdrawal: ₹100
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.background }]}
                                onPress={() => {
                                    setWithdrawModalVisible(false);
                                    setWithdrawAmount('');
                                }}
                            >
                                <Text style={[styles.modalButtonText, { color: theme.text }]}>
                                    Cancel
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                                onPress={handleWithdraw}
                            >
                                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                                    Confirm
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        paddingTop: 50
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700'
    },
    balanceCard: {
        margin: 16,
        padding: 24,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    balanceLabel: {
        fontSize: 14,
        marginBottom: 8
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: '700',
        marginBottom: 24
    },
    balanceBreakdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    balanceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    balanceIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    balanceItemLabel: {
        fontSize: 12,
        marginBottom: 4
    },
    balanceItemAmount: {
        fontSize: 16,
        fontWeight: '600'
    },
    withdrawButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        gap: 8
    },
    withdrawButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 16
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center'
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        marginTop: 8,
        marginBottom: 4
    },
    statLabel: {
        fontSize: 12,
        textAlign: 'center'
    },
    periodSelector: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 8,
        marginBottom: 16
    },
    periodButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center'
    },
    periodButtonText: {
        fontSize: 14,
        fontWeight: '600'
    },
    transactionsSection: {
        padding: 16
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16
    },
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12
    },
    transactionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    transactionDetails: {
        flex: 1
    },
    transactionDescription: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4
    },
    transactionDate: {
        fontSize: 12
    },
    transactionRight: {
        alignItems: 'flex-end'
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    statusText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'capitalize'
    },
    emptyState: {
        padding: 40,
        borderRadius: 12,
        alignItems: 'center'
    },
    emptyStateText: {
        marginTop: 12,
        fontSize: 14
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: '100%',
        padding: 24,
        borderRadius: 16
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: 20
    },
    input: {
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        marginBottom: 8
    },
    minAmountText: {
        fontSize: 12,
        marginBottom: 20
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12
    },
    modalButton: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center'
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600'
    }
});
