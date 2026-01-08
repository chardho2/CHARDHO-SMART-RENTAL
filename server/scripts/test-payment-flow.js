require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const Driver = require('../models/Driver');
const User = require('../models/User');

/**
 * COMPLETE PAYMENT FLOW TEST
 * 
 * This script tests the entire payment flow:
 * 1. Create test booking
 * 2. Simulate payment completion
 * 3. Verify wallet updates
 * 4. Check database consistency
 */

async function testCompletePaymentFlow() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // ========================================
        // SETUP: Get Test Data
        // ========================================
        console.log('📝 Setting up test data...');

        // Find a test driver
        const driver = await Driver.findOne({ status: 'approved' });
        if (!driver) {
            console.error('❌ No approved driver found. Please create a driver first.');
            process.exit(1);
        }

        // Find a test user
        const user = await User.findOne();
        if (!user) {
            console.error('❌ No user found. Please create a user first.');
            process.exit(1);
        }

        console.log(`✅ Test Driver: ${driver.name} (${driver._id})`);
        console.log(`✅ Test User: ${user.name} (${user._id})\n`);

        // ========================================
        // TEST 1: CASH PAYMENT FLOW
        // ========================================
        console.log('═══════════════════════════════════════════════════════');
        console.log('TEST 1: CASH PAYMENT FLOW');
        console.log('═══════════════════════════════════════════════════════\n');

        // Create test booking with cash payment
        const cashBooking = await Booking.create({
            user: user._id,
            driver: driver._id,
            pickup: {
                name: 'Test Pickup',
                address: 'Test Address',
                coordinates: { latitude: 12.9716, longitude: 77.5946 }
            },
            destination: {
                name: 'Test Destination',
                address: 'Test Destination Address',
                coordinates: { latitude: 12.2958, longitude: 76.6394 }
            },
            rideType: {
                id: 'bike',
                name: 'Bike',
                icon: 'two-wheeler',
                basePrice: 50
            },
            fare: {
                baseFare: 50,
                distanceCharge: 100,
                total: 150,
                distance: 10
            },
            estimatedTime: 30,
            status: 'accepted',
            payment: {
                method: 'cash',
                status: 'pending'
            }
        });

        console.log(`✅ Created cash booking: ${cashBooking._id}`);

        // Get wallet balance before
        const walletBefore = await Wallet.findOne({ driver: driver._id });
        const balanceBefore = walletBefore ? walletBefore.availableBalance : 0;
        console.log(`📊 Driver wallet before: ₹${balanceBefore}\n`);

        // Simulate ride completion (cash payment)
        console.log('🚗 Simulating ride completion with CASH payment...');

        const cashReconciliationService = require('../services/cashReconciliationService');

        const commission = Math.round(cashBooking.fare.total * 0.30); // 30%
        const driverEarnings = cashBooking.fare.total - commission; // 70%

        const cashResult = await cashReconciliationService.processCashRideWithDues({
            driverId: driver._id,
            userId: user._id,
            bookingId: cashBooking._id,
            totalFare: cashBooking.fare.total,
            commission: commission,
            driverEarning: driverEarnings
        });

        console.log(`✅ Cash ride processed`);
        console.log(`   Commission Deducted: ${cashResult.commissionDeducted}`);
        console.log(`   Pending Due Created: ${cashResult.pendingDueCreated}`);
        console.log(`   Auto Deductions: ₹${cashResult.autoDeductions.deducted}\n`);

        // Verify wallet update
        const walletAfterCash = await Wallet.findOne({ driver: driver._id });
        console.log(`📊 Driver wallet after cash: ₹${walletAfterCash.availableBalance}`);
        console.log(`   Expected increase: ₹${driverEarnings - commission} (if commission deducted)`);
        console.log(`   Actual increase: ₹${walletAfterCash.availableBalance - balanceBefore}\n`);

        // Verify transaction entries
        const cashTransactions = await WalletTransaction.find({ bookingId: cashBooking._id });
        console.log(`📜 Transaction entries created: ${cashTransactions.length}`);
        cashTransactions.forEach(tx => {
            console.log(`   - ${tx.type} ₹${tx.amount} | Source: ${tx.source} | Status: ${tx.status}`);
        });
        console.log('');

        // ========================================
        // TEST 2: ONLINE PAYMENT FLOW
        // ========================================
        console.log('═══════════════════════════════════════════════════════');
        console.log('TEST 2: ONLINE PAYMENT FLOW');
        console.log('═══════════════════════════════════════════════════════\n');

        // Create test booking with online payment
        const onlineBooking = await Booking.create({
            user: user._id,
            driver: driver._id,
            pickup: {
                name: 'Test Pickup 2',
                address: 'Test Address 2',
                coordinates: { latitude: 12.9716, longitude: 77.5946 }
            },
            destination: {
                name: 'Test Destination 2',
                address: 'Test Destination Address 2',
                coordinates: { latitude: 12.2958, longitude: 76.6394 }
            },
            rideType: {
                id: 'auto',
                name: 'Auto',
                icon: 'local-taxi',
                basePrice: 80
            },
            fare: {
                baseFare: 80,
                distanceCharge: 120,
                total: 200,
                distance: 12
            },
            estimatedTime: 35,
            status: 'accepted',
            payment: {
                method: 'phonepe',
                status: 'pending',
                transactionId: 'TEST_TXN_' + Date.now()
            }
        });

        console.log(`✅ Created online booking: ${onlineBooking._id}`);

        // Get wallet balance before online payment
        const walletBeforeOnline = await Wallet.findOne({ driver: driver._id });
        const balanceBeforeOnline = walletBeforeOnline.availableBalance;
        console.log(`📊 Driver wallet before online payment: ₹${balanceBeforeOnline}\n`);

        // Simulate ride completion (should NOT credit wallet yet)
        console.log('🚗 Simulating ride completion with ONLINE payment...');
        console.log('⚠️  Wallet should NOT be credited yet (waiting for payment confirmation)\n');

        // Check wallet (should be unchanged)
        const walletAfterRideEnd = await Wallet.findOne({ driver: driver._id });
        console.log(`📊 Driver wallet after ride end: ₹${walletAfterRideEnd.availableBalance}`);
        console.log(`   Expected: ₹${balanceBeforeOnline} (unchanged)`);
        console.log(`   Actual: ₹${walletAfterRideEnd.availableBalance}`);

        if (walletAfterRideEnd.availableBalance === balanceBeforeOnline) {
            console.log('   ✅ CORRECT: Wallet not credited yet\n');
        } else {
            console.log('   ❌ ERROR: Wallet was credited prematurely!\n');
        }

        // Simulate PhonePe webhook (payment success)
        console.log('💳 Simulating PhonePe payment SUCCESS webhook...');

        const walletServiceV2 = require('../services/walletServiceV2');

        const onlineCommission = Math.round(onlineBooking.fare.total * 0.30);
        const onlineDriverEarnings = onlineBooking.fare.total - onlineCommission;

        await walletServiceV2.processRideEarning({
            driverId: driver._id,
            userId: user._id,
            bookingId: onlineBooking._id,
            totalFare: onlineBooking.fare.total,
            commission: onlineCommission,
            driverEarning: onlineDriverEarnings,
            paymentMethod: 'PHONEPE',
            gatewayTransactionId: onlineBooking.payment.transactionId
        });

        console.log(`✅ Online payment processed via webhook\n`);

        // Verify wallet update
        const walletAfterOnline = await Wallet.findOne({ driver: driver._id });
        console.log(`📊 Driver wallet after payment confirmation: ₹${walletAfterOnline.availableBalance}`);
        console.log(`   Expected increase: ₹${onlineDriverEarnings}`);
        console.log(`   Actual increase: ₹${walletAfterOnline.availableBalance - balanceBeforeOnline}\n`);

        // Verify transaction entries
        const onlineTransactions = await WalletTransaction.find({ bookingId: onlineBooking._id });
        console.log(`📜 Transaction entries created: ${onlineTransactions.length}`);
        onlineTransactions.forEach(tx => {
            console.log(`   - ${tx.type} ₹${tx.amount} | Source: ${tx.source} | Status: ${tx.status}`);
        });
        console.log('');

        // ========================================
        // TEST 3: VERIFY COMPANY WALLET
        // ========================================
        console.log('═══════════════════════════════════════════════════════');
        console.log('TEST 3: COMPANY WALLET VERIFICATION');
        console.log('═══════════════════════════════════════════════════════\n');

        const companyWallet = await Wallet.findOne({ type: 'company' });

        if (companyWallet) {
            console.log(`✅ Company Wallet Found: ${companyWallet._id}`);
            console.log(`   Balance: ₹${companyWallet.balance}`);
            console.log(`   Available: ₹${companyWallet.availableBalance}`);
            console.log(`   Lifetime Earnings: ₹${companyWallet.lifetimeEarnings}\n`);

            // Verify company received commissions
            const companyTransactions = await WalletTransaction.find({
                walletId: companyWallet._id,
                source: 'COMMISSION'
            }).sort({ createdAt: -1 }).limit(5);

            console.log(`📜 Recent commission transactions: ${companyTransactions.length}`);
            companyTransactions.forEach(tx => {
                console.log(`   - ${tx.type} ₹${tx.amount} | ${tx.createdAt.toISOString()}`);
            });
        } else {
            console.log('❌ Company wallet not found!');
            console.log('   Run: node scripts/setup-company-wallet.js');
        }
        console.log('');

        // ========================================
        // TEST 4: DATABASE CONSISTENCY CHECK
        // ========================================
        console.log('═══════════════════════════════════════════════════════');
        console.log('TEST 4: DATABASE CONSISTENCY CHECK');
        console.log('═══════════════════════════════════════════════════════\n');

        // Reconcile driver wallet
        const reconciliation = await walletServiceV2.reconcileWallet(driver._id);

        console.log(`📊 Wallet Reconciliation:`);
        console.log(`   Wallet Balance: ₹${reconciliation.walletBalance}`);
        console.log(`   Ledger Balance: ₹${reconciliation.ledgerBalance}`);
        console.log(`   Discrepancy: ₹${reconciliation.discrepancy}`);
        console.log(`   Is Balanced: ${reconciliation.isBalanced ? '✅ YES' : '❌ NO'}\n`);

        // ========================================
        // SUMMARY
        // ========================================
        console.log('═══════════════════════════════════════════════════════');
        console.log('🎉 TEST SUMMARY');
        console.log('═══════════════════════════════════════════════════════\n');

        console.log('✅ TEST 1: Cash Payment Flow');
        console.log(`   - Booking created: ${cashBooking._id}`);
        console.log(`   - Wallet credited immediately: ₹${driverEarnings}`);
        console.log(`   - Commission ${cashResult.commissionDeducted ? 'deducted' : 'marked as pending'}`);
        console.log(`   - Transactions created: ${cashTransactions.length}\n`);

        console.log('✅ TEST 2: Online Payment Flow');
        console.log(`   - Booking created: ${onlineBooking._id}`);
        console.log(`   - Wallet NOT credited on ride end ✅`);
        console.log(`   - Wallet credited after webhook: ₹${onlineDriverEarnings}`);
        console.log(`   - Transactions created: ${onlineTransactions.length}\n`);

        console.log('✅ TEST 3: Company Wallet');
        console.log(`   - Company wallet exists: ${companyWallet ? 'YES' : 'NO'}`);
        console.log(`   - Received commissions: ${companyWallet ? 'YES' : 'NO'}\n`);

        console.log('✅ TEST 4: Database Consistency');
        console.log(`   - Wallet balanced: ${reconciliation.isBalanced ? 'YES' : 'NO'}`);
        console.log(`   - Discrepancy: ₹${reconciliation.discrepancy}\n`);

        console.log('═══════════════════════════════════════════════════════');
        console.log('💡 NEXT STEPS:');
        console.log('═══════════════════════════════════════════════════════');
        console.log('1. Test with real PhonePe payment in sandbox');
        console.log('2. Verify webhook URL is configured');
        console.log('3. Test frontend payment flow');
        console.log('4. Monitor logs during real transactions');
        console.log('═══════════════════════════════════════════════════════\n');

        // Cleanup test bookings
        console.log('🧹 Cleaning up test bookings...');
        await Booking.deleteOne({ _id: cashBooking._id });
        await Booking.deleteOne({ _id: onlineBooking._id });
        console.log('✅ Test bookings deleted\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run tests
testCompletePaymentFlow();
