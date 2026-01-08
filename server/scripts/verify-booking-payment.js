require('dotenv').config();
const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const Booking = require('../models/Booking');

/**
 * VERIFY SPECIFIC BOOKING PAYMENT
 * 
 * Check if wallet was updated for booking: 695b6d018a95451eb48e626d
 */

async function verifyBookingPayment() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const bookingId = '695b6d018a95451eb48e626d';
        const driverId = '695a0e166fcc317d98129757';

        console.log('═══════════════════════════════════════════════════════');
        console.log('VERIFYING BOOKING PAYMENT');
        console.log('═══════════════════════════════════════════════════════\n');

        // 1. Check booking
        console.log('📋 Checking Booking...');
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            console.log('❌ Booking not found!');
            process.exit(1);
        }

        console.log(`✅ Booking Found: ${booking._id}`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   Fare: ₹${booking.fare.total}`);
        console.log(`   Payment Method: ${booking.payment.method}`);
        console.log(`   Payment Status: ${booking.payment.status}`);
        console.log('');

        // 2. Check driver wallet
        console.log('💰 Checking Driver Wallet...');
        const wallet = await Wallet.findOne({ driver: driverId });

        if (!wallet) {
            console.log('❌ Driver wallet not found!');
            console.log('   Creating wallet...');
            const newWallet = await Wallet.getOrCreate(driverId);
            console.log(`✅ Wallet created: ${newWallet._id}`);
        } else {
            console.log(`✅ Wallet Found: ${wallet._id}`);
            console.log(`   Balance: ₹${wallet.balance}`);
            console.log(`   Available Balance: ₹${wallet.availableBalance}`);
            console.log(`   Locked Balance: ₹${wallet.lockedBalance}`);
            console.log(`   Lifetime Earnings: ₹${wallet.lifetimeEarnings}`);
            console.log(`   Total Withdrawn: ₹${wallet.totalWithdrawn}`);
        }
        console.log('');

        // 3. Check wallet transactions
        console.log('📜 Checking Wallet Transactions...');
        const transactions = await WalletTransaction.find({
            bookingId: bookingId
        }).sort({ createdAt: 1 });

        if (transactions.length === 0) {
            console.log('❌ No wallet transactions found for this booking!');
            console.log('');
            console.log('⚠️  ISSUE DETECTED:');
            console.log('   The ride was completed but wallet was NOT updated.');
            console.log('');
            console.log('💡 SOLUTION:');
            console.log('   The payment processing might have failed.');
            console.log('   Check server logs for errors during ride completion.');
            console.log('');
            console.log('🔧 MANUAL FIX:');
            console.log('   You can manually process this payment:');
            console.log('');
            console.log('   const cashReconciliationService = require("./services/cashReconciliationService");');
            console.log('   await cashReconciliationService.processCashRideWithDues({');
            console.log(`     driverId: "${driverId}",`);
            console.log(`     userId: "${booking.user}",`);
            console.log(`     bookingId: "${bookingId}",`);
            console.log(`     totalFare: ${booking.fare.total},`);
            console.log(`     commission: ${Math.round(booking.fare.total * 0.30)},`);
            console.log(`     driverEarning: ${Math.round(booking.fare.total * 0.70)}`);
            console.log('   });');
        } else {
            console.log(`✅ Found ${transactions.length} transaction(s):`);
            console.log('');

            transactions.forEach((tx, index) => {
                console.log(`   Transaction ${index + 1}:`);
                console.log(`   - ID: ${tx._id}`);
                console.log(`   - Type: ${tx.type}`);
                console.log(`   - Amount: ₹${tx.amount}`);
                console.log(`   - Source: ${tx.source}`);
                console.log(`   - Status: ${tx.status}`);
                console.log(`   - Balance Before: ₹${tx.balanceBefore}`);
                console.log(`   - Balance After: ₹${tx.balanceAfter}`);
                console.log(`   - Created: ${tx.createdAt}`);
                console.log('');
            });

            // Verify amounts
            const expectedDriverEarning = Math.round(booking.fare.total * 0.70);
            const expectedCommission = Math.round(booking.fare.total * 0.30);

            const driverCredit = transactions.find(tx =>
                tx.type === 'CREDIT' && tx.source === 'RIDE_PAYMENT'
            );

            const commissionDebit = transactions.find(tx =>
                tx.type === 'DEBIT' && tx.source === 'COMMISSION_DEDUCTION'
            );

            console.log('✅ VERIFICATION:');
            console.log(`   Expected Driver Earning: ₹${expectedDriverEarning}`);
            console.log(`   Actual Driver Credit: ₹${driverCredit?.amount || 0}`);
            console.log(`   Match: ${driverCredit?.amount === expectedDriverEarning ? '✅ YES' : '❌ NO'}`);
            console.log('');
            console.log(`   Expected Commission: ₹${expectedCommission}`);
            console.log(`   Actual Commission Debit: ₹${commissionDebit?.amount || 0}`);
            console.log(`   Match: ${commissionDebit?.amount === expectedCommission ? '✅ YES' : '❌ NO'}`);
        }
        console.log('');

        // 4. Check company wallet
        console.log('🏢 Checking Company Wallet...');
        const companyWallet = await Wallet.findOne({ type: 'company' });

        if (!companyWallet) {
            console.log('❌ Company wallet not found!');
            console.log('   Run: node scripts/setup-company-wallet.js');
        } else {
            console.log(`✅ Company Wallet Found: ${companyWallet._id}`);
            console.log(`   Balance: ₹${companyWallet.balance}`);
            console.log(`   Lifetime Earnings: ₹${companyWallet.lifetimeEarnings}`);
        }
        console.log('');

        console.log('═══════════════════════════════════════════════════════');
        console.log('SUMMARY');
        console.log('═══════════════════════════════════════════════════════\n');

        if (transactions.length > 0) {
            console.log('✅ Payment processed successfully!');
            console.log(`   - Booking completed: ${booking.status === 'completed' ? 'YES' : 'NO'}`);
            console.log(`   - Wallet updated: YES`);
            console.log(`   - Transactions created: ${transactions.length}`);
            console.log(`   - Driver received: ₹${transactions.find(tx => tx.type === 'CREDIT')?.amount || 0}`);
        } else {
            console.log('❌ Payment NOT processed!');
            console.log(`   - Booking completed: ${booking.status === 'completed' ? 'YES' : 'NO'}`);
            console.log(`   - Wallet updated: NO`);
            console.log(`   - Transactions created: 0`);
            console.log('');
            console.log('⚠️  Action Required: Process payment manually (see above)');
        }

        console.log('');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

verifyBookingPayment();
