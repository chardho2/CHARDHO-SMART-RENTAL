require('dotenv').config();
const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');

/**
 * CREATE UNIQUE INDEXES FOR WALLETS
 * 
 * This script ensures:
 * 1. Each driver can have only ONE wallet
 * 2. Only ONE company wallet can exist
 * 
 * Run this after updating the Wallet model
 */

async function createUniqueIndexes() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        console.log('📊 Current Wallet Statistics:');
        const totalWallets = await Wallet.countDocuments();
        const driverWallets = await Wallet.countDocuments({ type: 'driver' });
        const companyWallets = await Wallet.countDocuments({ type: 'company' });

        console.log(`   Total Wallets: ${totalWallets}`);
        console.log(`   Driver Wallets: ${driverWallets}`);
        console.log(`   Company Wallets: ${companyWallets}\n`);

        // Check for duplicate driver wallets
        console.log('🔍 Checking for duplicate driver wallets...');
        const duplicates = await Wallet.aggregate([
            { $match: { type: 'driver', driver: { $ne: null } } },
            { $group: { _id: '$driver', count: { $sum: 1 } } },
            { $match: { count: { $gt: 1 } } }
        ]);

        if (duplicates.length > 0) {
            console.log('⚠️  WARNING: Found duplicate driver wallets!');
            console.log('   Duplicates:', duplicates.length);
            console.log('   Details:', duplicates);
            console.log('\n❌ Please clean up duplicates before creating unique index!');
            console.log('   Run: node scripts/cleanup-duplicate-wallets.js\n');
            process.exit(1);
        } else {
            console.log('✅ No duplicate driver wallets found\n');
        }

        // Check for multiple company wallets
        if (companyWallets > 1) {
            console.log('⚠️  WARNING: Found multiple company wallets!');
            console.log(`   Count: ${companyWallets}`);
            console.log('\n❌ Please clean up extra company wallets before creating unique index!');
            console.log('   Keep only one company wallet and delete the rest.\n');
            process.exit(1);
        } else {
            console.log('✅ Only one (or zero) company wallet found\n');
        }

        // Drop existing indexes (except _id)
        console.log('🗑️  Dropping old indexes...');
        try {
            await Wallet.collection.dropIndexes();
            console.log('✅ Old indexes dropped\n');
        } catch (error) {
            console.log('⚠️  No indexes to drop or error:', error.message, '\n');
        }

        // Create new indexes
        console.log('🔨 Creating unique indexes...');
        await Wallet.createIndexes();
        console.log('✅ Unique indexes created\n');

        // Verify indexes
        console.log('📋 Verifying indexes...');
        const indexes = await Wallet.collection.getIndexes();
        console.log('   Indexes created:');
        Object.keys(indexes).forEach(indexName => {
            const index = indexes[indexName];
            console.log(`   - ${indexName}:`, JSON.stringify(index.key),
                index.unique ? '(UNIQUE)' : '');
        });
        console.log('');

        // Test: Try to create duplicate driver wallet (should fail)
        console.log('🧪 Testing uniqueness constraint...');
        const testDriverId = new mongoose.Types.ObjectId();

        try {
            // Create first wallet
            const wallet1 = await Wallet.create({
                driver: testDriverId,
                type: 'driver',
                balance: 0
            });
            console.log('✅ Created test wallet 1:', wallet1._id);

            // Try to create duplicate (should fail)
            try {
                const wallet2 = await Wallet.create({
                    driver: testDriverId,
                    type: 'driver',
                    balance: 0
                });
                console.log('❌ FAILED: Duplicate wallet created! Uniqueness not working!');
                console.log('   Wallet 2:', wallet2._id);
            } catch (dupError) {
                if (dupError.code === 11000) {
                    console.log('✅ Uniqueness working! Duplicate creation blocked as expected.');
                } else {
                    throw dupError;
                }
            }

            // Clean up test wallet
            await Wallet.deleteOne({ _id: wallet1._id });
            console.log('✅ Test wallet cleaned up\n');

        } catch (testError) {
            console.error('❌ Test failed:', testError.message, '\n');
        }

        console.log('═══════════════════════════════════════════════════════');
        console.log('🎉 UNIQUE INDEXES CREATED SUCCESSFULLY!');
        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ Each driver can now have only ONE wallet');
        console.log('✅ Only ONE company wallet can exist');
        console.log('✅ Duplicate prevention is active');
        console.log('═══════════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

createUniqueIndexes();
