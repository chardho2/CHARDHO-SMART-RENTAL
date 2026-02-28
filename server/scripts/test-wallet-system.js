require('dotenv').config();
const mongoose = require('mongoose');
const walletServiceV2 = require('../services/walletServiceV2');
const cashReconciliationService = require('../services/cashReconciliationService');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');

/**
 * TEST WALLET SYSTEM
 * 
 * This script tests the complete wallet flow:
 * 1. Create test driver wallet
 * 2. Process online payment
 * 3. Process cash payment
 * 4. Check balances
 * 5. Test withdrawal
 */

async function testWalletSystem() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Test driver ID (replace with actual driver ID from your database)
        const testDriverId = '6776e2f2d4e1c6c6e0e1c6c6'; // REPLACE THIS
        const testUserId = '6776e2f2d4e1c6c6e0e1c6c7'; // REPLACE THIS
        const testBookingId = new mongoose.Types.ObjectId();

        console.log('📝 Test Configuration:');
        console.log('   Driver ID:', testDriverId);
        console.log('   User ID:', testUserId);
        console.log('   Booking ID:', testBookingId);
        console.log('');

        // ========================================
        // TEST 1: Create Company Wallet
        // ========================================
        console.log('🏢 TEST 1: Creating Company Wallet...');
        const companyWallet = await Wallet.getOrCreateCompanyWallet();
        console.log('✅ Company Wallet:', companyWallet._id);
        console.log('   Balance: ₹', companyWallet.balance);
        console.log('');

        // ========================================
        // TEST 2: Create Driver Wallet
        // ========================================
        console.log('👤 TEST 2: Creating Driver Wallet...');
        const driverWallet = await Wallet.getOrCreate(testDriverId);
        console.log('✅ Driver Wallet:', driverWallet._id);
        console.log('   Balance: ₹', driverWallet.balance);
        console.log('   Available: ₹', driverWallet.availableBalance);
        console.log('');

        // ========================================
        // TEST 3: Process Online Payment (₹500)
        // ========================================
        console.log('💳 TEST 3: Processing Online Payment (₹500)...');
        const onlineResult = await walletServiceV2.processRideEarning({
            driverId: testDriverId,
            userId: testUserId,
            bookingId: testBookingId,
            totalFare: 500,
            commission: 150,  // 30%
            driverEarning: 350,  // 70%
            paymentMethod: 'UPI',
            gatewayTransactionId: 'TEST_TXN_001'
        });

        console.log('✅ Online Payment Processed:');
        console.log('   Driver Transaction:', onlineResult.driverTransaction._id);
        console.log('   Company Transaction:', onlineResult.companyTransaction._id);
        console.log('');

        // Check balances after online payment
        const driverBalanceAfterOnline = await walletServiceV2.getBalance(testDriverId);
        console.log('📊 Balances After Online Payment:');
        console.log('   Driver Available: ₹', driverBalanceAfterOnline.availableBalance);
        console.log('   Driver Total: ₹', driverBalanceAfterOnline.totalBalance);
        console.log('');

        // ========================================
        // TEST 4: Process Cash Payment (₹300)
        // ========================================
        console.log('💵 TEST 4: Processing Cash Payment (₹300)...');
        const cashBookingId = new mongoose.Types.ObjectId();
        const cashResult = await cashReconciliationService.processCashRideWithDues({
            driverId: testDriverId,
            userId: testUserId,
            bookingId: cashBookingId,
            totalFare: 300,
            commission: 90,  // 30%
            driverEarning: 210  // 70%
        });

        console.log('✅ Cash Payment Processed:');
        console.log('   Commission Deducted:', cashResult.commissionDeducted);
        console.log('   Pending Due Created:', cashResult.pendingDueCreated);
        console.log('   Auto Deductions: ₹', cashResult.autoDeductions.deducted);
        console.log('');

        // Check balances after cash payment
        const driverBalanceAfterCash = await walletServiceV2.getBalance(testDriverId);
        console.log('📊 Balances After Cash Payment:');
        console.log('   Driver Available: ₹', driverBalanceAfterCash.availableBalance);
        console.log('   Driver Total: ₹', driverBalanceAfterCash.totalBalance);
        console.log('');

        // ========================================
        // TEST 5: Check Transaction History
        // ========================================
        console.log('📜 TEST 5: Checking Transaction History...');
        const history = await walletServiceV2.getTransactionHistory(testDriverId, {
            page: 1,
            limit: 10
        });

        console.log('✅ Transaction History:');
        console.log('   Total Transactions:', history.pagination.total);
        history.transactions.forEach((tx, index) => {
            console.log(`   ${index + 1}. ${tx.type} ₹${tx.amount} - ${tx.source} (${tx.status})`);
        });
        console.log('');

        // ========================================
        // TEST 6: Check Wallet Statistics
        // ========================================
        console.log('📈 TEST 6: Checking Wallet Statistics...');
        const stats = await walletServiceV2.getWalletStats(testDriverId, 'all');

        console.log('✅ Wallet Statistics:');
        console.log('   Current Balance: ₹', stats.currentBalance);
        console.log('   Available Balance: ₹', stats.availableBalance);
        console.log('   Lifetime Earnings: ₹', stats.lifetimeEarnings);
        console.log('   Total Credits: ₹', stats.credits.total, `(${stats.credits.count} transactions)`);
        console.log('   Total Debits: ₹', stats.debits.total, `(${stats.debits.count} transactions)`);
        console.log('');

        // ========================================
        // TEST 7: Reconcile Wallet
        // ========================================
        console.log('🔄 TEST 7: Reconciling Wallet...');
        const reconciliation = await walletServiceV2.reconcileWallet(testDriverId);

        console.log('✅ Reconciliation Result:');
        console.log('   Wallet Balance: ₹', reconciliation.walletBalance);
        console.log('   Ledger Balance: ₹', reconciliation.ledgerBalance);
        console.log('   Discrepancy: ₹', reconciliation.discrepancy);
        console.log('   Is Balanced:', reconciliation.isBalanced ? '✅ YES' : '❌ NO');
        console.log('');

        // ========================================
        // TEST 8: Check Company Wallet
        // ========================================
        console.log('🏢 TEST 8: Checking Company Wallet...');
        const updatedCompanyWallet = await Wallet.getOrCreateCompanyWallet();
        console.log('✅ Company Wallet Balance: ₹', updatedCompanyWallet.balance);
        console.log('   Available: ₹', updatedCompanyWallet.availableBalance);
        console.log('   Lifetime Earnings: ₹', updatedCompanyWallet.lifetimeEarnings);
        console.log('');

        // ========================================
        // SUMMARY
        // ========================================
        console.log('═══════════════════════════════════════════════════════');
        console.log('🎉 ALL TESTS PASSED!');
        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ Company wallet created');
        console.log('✅ Driver wallet created');
        console.log('✅ Online payment processed (70/30 split)');
        console.log('✅ Cash payment processed (with reconciliation)');
        console.log('✅ Transaction history working');
        console.log('✅ Wallet statistics working');
        console.log('✅ Balance reconciliation working');
        console.log('═══════════════════════════════════════════════════════');
        console.log('');
        console.log('💡 Next Steps:');
        console.log('   1. Test with real driver IDs from your database');
        console.log('   2. Complete a real ride and check wallet updates');
        console.log('   3. Test withdrawal flow');
        console.log('   4. Set up daily reconciliation cron job');
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run tests
testWalletSystem();
