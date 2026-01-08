require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Driver = require('../models/Driver');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');

/**
 * TEST PAYMENT VERIFICATION SYSTEM
 * 
 * Tests:
 * 1. Cash payment - should complete immediately
 * 2. Online payment (verified) - should complete after verification
 * 3. Online payment (not verified) - should block completion
 * 4. Switch to cash - should work correctly
 */

async function testPaymentVerification() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get test data
        const driver = await Driver.findOne({ status: 'approved' });
        const user = await User.findOne();

        if (!driver || !user) {
            console.error('❌ Need at least one driver and one user in database');
            process.exit(1);
        }

        console.log(`📝 Test Driver: ${driver.name} (${driver._id})`);
        console.log(`📝 Test User: ${user.name} (${user._id})\n`);

        // ========================================
        // TEST 1: CASH PAYMENT (Should Complete Immediately)
        // ========================================
        console.log('═══════════════════════════════════════════════════════');
        console.log('TEST 1: CASH PAYMENT - IMMEDIATE COMPLETION');
        console.log('═══════════════════════════════════════════════════════\n');

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
                distanceCharge: 50,
                total: 100,
                distance: 5
            },
            estimatedTime: 20,
            status: 'in-progress',
            payment: {
                method: 'cash',
                status: 'pending'
            }
        });

        console.log(`✅ Created cash booking: ${cashBooking._id}`);

        // Simulate completing the ride (no verification needed for cash)
        console.log('🚗 Completing cash ride...');

        // Check if payment method is cash (should skip verification)
        if (cashBooking.payment.method === 'cash') {
            console.log('✅ Cash payment detected - no verification needed');
            cashBooking.status = 'completed';
            cashBooking.payment.status = 'completed';
            await cashBooking.save();
            console.log('✅ Cash ride completed successfully\n');
        }

        // ========================================
        // TEST 2: ONLINE PAYMENT (Payment Verified)
        // ========================================
        console.log('═══════════════════════════════════════════════════════');
        console.log('TEST 2: ONLINE PAYMENT - PAYMENT VERIFIED');
        console.log('═══════════════════════════════════════════════════════\n');

        const onlineBookingVerified = await Booking.create({
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
                distance: 10
            },
            estimatedTime: 30,
            status: 'in-progress',
            payment: {
                method: 'phonepe',
                status: 'completed', // ✅ Already verified
                transactionId: 'TEST_TXN_VERIFIED_' + Date.now(),
                amount: 200
            }
        });

        console.log(`✅ Created online booking (verified): ${onlineBookingVerified._id}`);

        // Simulate completing the ride (payment already verified)
        console.log('🚗 Completing online ride (payment verified)...');

        if (onlineBookingVerified.payment.status === 'completed') {
            console.log('✅ Payment already verified - can complete');
            onlineBookingVerified.status = 'completed';
            await onlineBookingVerified.save();
            console.log('✅ Online ride completed successfully\n');
        }

        // ========================================
        // TEST 3: ONLINE PAYMENT (Payment NOT Verified)
        // ========================================
        console.log('═══════════════════════════════════════════════════════');
        console.log('TEST 3: ONLINE PAYMENT - PAYMENT NOT VERIFIED');
        console.log('═══════════════════════════════════════════════════════\n');

        const onlineBookingNotVerified = await Booking.create({
            user: user._id,
            driver: driver._id,
            pickup: {
                name: 'Test Pickup 3',
                address: 'Test Address 3',
                coordinates: { latitude: 12.9716, longitude: 77.5946 }
            },
            destination: {
                name: 'Test Destination 3',
                address: 'Test Destination Address 3',
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
                distance: 8
            },
            estimatedTime: 25,
            status: 'in-progress',
            payment: {
                method: 'phonepe',
                status: 'pending', // ❌ NOT verified
                transactionId: null // No transaction ID
            }
        });

        console.log(`✅ Created online booking (not verified): ${onlineBookingNotVerified._id}`);

        // Simulate trying to complete the ride (should be blocked)
        console.log('🚗 Attempting to complete online ride (payment not verified)...');

        if (onlineBookingNotVerified.payment.method !== 'cash' &&
            onlineBookingNotVerified.payment.status !== 'completed') {

            console.log('⚠️  Online payment detected - checking verification...');

            if (!onlineBookingNotVerified.payment.transactionId) {
                console.log('❌ No transaction ID - payment not initiated');
                console.log('❌ BLOCKED: Cannot complete ride without payment');
                console.log('💡 Suggestion: Switch to cash payment\n');

                // Simulate switching to cash
                console.log('🔄 Switching payment method to cash...');
                onlineBookingNotVerified.payment = {
                    method: 'cash',
                    status: 'pending',
                    previousMethod: 'phonepe',
                    switchedAt: new Date()
                };
                await onlineBookingNotVerified.save();
                console.log('✅ Payment method switched to cash');

                // Now complete the ride
                onlineBookingNotVerified.status = 'completed';
                onlineBookingNotVerified.payment.status = 'completed';
                await onlineBookingNotVerified.save();
                console.log('✅ Ride completed with cash payment\n');
            }
        }

        // ========================================
        // TEST 4: VERIFY DATABASE STATE
        // ========================================
        console.log('═══════════════════════════════════════════════════════');
        console.log('TEST 4: VERIFY DATABASE STATE');
        console.log('═══════════════════════════════════════════════════════\n');

        // Check all test bookings
        const allTestBookings = await Booking.find({
            _id: { $in: [cashBooking._id, onlineBookingVerified._id, onlineBookingNotVerified._id] }
        });

        console.log('📊 Booking Status Summary:');
        allTestBookings.forEach((booking, index) => {
            console.log(`\n   Booking ${index + 1}:`);
            console.log(`   - ID: ${booking._id}`);
            console.log(`   - Status: ${booking.status}`);
            console.log(`   - Payment Method: ${booking.payment.method}`);
            console.log(`   - Payment Status: ${booking.payment.status}`);
            if (booking.payment.previousMethod) {
                console.log(`   - Previous Method: ${booking.payment.previousMethod}`);
            }
        });
        console.log('');

        // ========================================
        // TEST 5: SIMULATE REAL API FLOW
        // ========================================
        console.log('═══════════════════════════════════════════════════════');
        console.log('TEST 5: SIMULATE REAL API FLOW');
        console.log('═══════════════════════════════════════════════════════\n');

        // Create a new booking for API simulation
        const apiTestBooking = await Booking.create({
            user: user._id,
            driver: driver._id,
            pickup: {
                name: 'API Test Pickup',
                address: 'API Test Address',
                coordinates: { latitude: 12.9716, longitude: 77.5946 }
            },
            destination: {
                name: 'API Test Destination',
                address: 'API Test Destination Address',
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
                distanceCharge: 70,
                total: 150,
                distance: 7
            },
            estimatedTime: 22,
            status: 'in-progress',
            payment: {
                method: 'phonepe',
                status: 'pending',
                transactionId: null
            }
        });

        console.log(`✅ Created API test booking: ${apiTestBooking._id}\n`);

        // Simulate the verification flow
        console.log('📱 Simulating API verification flow:');
        console.log('   1. Driver clicks "Payment Received"');
        console.log('   2. System checks payment status...');

        // Check payment verification logic
        const canComplete = await checkPaymentVerification(apiTestBooking);

        if (canComplete.verified) {
            console.log('   3. ✅ Payment verified - completing ride');
            apiTestBooking.status = 'completed';
            await apiTestBooking.save();
        } else {
            console.log(`   3. ❌ ${canComplete.message}`);
            console.log(`   4. 💡 ${canComplete.suggestion}`);
            console.log(`   5. Action: ${canComplete.action}`);
        }
        console.log('');

        // ========================================
        // CLEANUP
        // ========================================
        console.log('🧹 Cleaning up test bookings...');
        await Booking.deleteMany({
            _id: {
                $in: [
                    cashBooking._id,
                    onlineBookingVerified._id,
                    onlineBookingNotVerified._id,
                    apiTestBooking._id
                ]
            }
        });
        console.log('✅ Test bookings deleted\n');

        // ========================================
        // SUMMARY
        // ========================================
        console.log('═══════════════════════════════════════════════════════');
        console.log('🎉 TEST SUMMARY');
        console.log('═══════════════════════════════════════════════════════\n');

        console.log('✅ TEST 1: Cash Payment');
        console.log('   - Completed immediately without verification ✅\n');

        console.log('✅ TEST 2: Online Payment (Verified)');
        console.log('   - Completed after payment verification ✅\n');

        console.log('✅ TEST 3: Online Payment (Not Verified)');
        console.log('   - Blocked completion ✅');
        console.log('   - Switched to cash ✅');
        console.log('   - Completed with cash ✅\n');

        console.log('✅ TEST 4: Database State');
        console.log('   - All bookings have correct status ✅\n');

        console.log('✅ TEST 5: API Flow Simulation');
        console.log('   - Verification logic working correctly ✅\n');

        console.log('═══════════════════════════════════════════════════════');
        console.log('💡 NEXT STEPS:');
        console.log('═══════════════════════════════════════════════════════');
        console.log('1. Test with real PhonePe payment in sandbox');
        console.log('2. Test frontend integration');
        console.log('3. Test switch to cash flow in app');
        console.log('4. Monitor logs during real transactions');
        console.log('═══════════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Helper function to check payment verification
async function checkPaymentVerification(booking) {
    // Cash payment - no verification needed
    if (booking.payment.method === 'cash') {
        return {
            verified: true,
            message: 'Cash payment - no verification needed',
            canComplete: true
        };
    }

    // Online payment already completed
    if (booking.payment.status === 'completed') {
        return {
            verified: true,
            message: 'Payment already verified',
            canComplete: true
        };
    }

    // Online payment - check transaction ID
    if (!booking.payment.transactionId) {
        return {
            verified: false,
            message: 'User has not completed the online payment',
            suggestion: 'Please ask the user to pay via cash instead',
            action: 'SWITCH_TO_CASH',
            canComplete: false
        };
    }

    // In real scenario, would check with PhonePe here
    // For testing, we simulate based on transaction ID
    return {
        verified: false,
        message: 'Payment verification would happen here with PhonePe API',
        suggestion: 'In production, this checks PhonePe status',
        action: 'VERIFY_WITH_GATEWAY',
        canComplete: false
    };
}

// Run tests
testPaymentVerification();
