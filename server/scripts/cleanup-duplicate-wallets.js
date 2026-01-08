require('dotenv').config();
const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');

/**
 * CLEANUP DUPLICATE WALLETS
 * 
 * This script:
 * 1. Finds duplicate driver wallets
 * 2. Merges balances and transactions
 * 3. Keeps the oldest wallet
 * 4. Deletes duplicates
 */

async function cleanupDuplicateWallets() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Find duplicate driver wallets
        console.log('🔍 Finding duplicate driver wallets...');
        const duplicates = await Wallet.aggregate([
            { $match: { type: 'driver', driver: { $ne: null } } },
            {
                $group: {
                    _id: '$driver',
                    count: { $sum: 1 },
                    wallets: { $push: { id: '$_id', balance: '$balance', created: '$createdAt' } }
                }
            },
            { $match: { count: { $gt: 1 } } }
        ]);

        if (duplicates.length === 0) {
            console.log('✅ No duplicate driver wallets found!\n');
            process.exit(0);
        }

        console.log(`⚠️  Found ${duplicates.length} drivers with duplicate wallets\n`);

        for (const dup of duplicates) {
            const driverId = dup._id;
            console.log(`\n📝 Processing Driver: ${driverId}`);
            console.log(`   Duplicate wallets: ${dup.count}`);

            // Get all wallets for this driver
            const wallets = await Wallet.find({ driver: driverId }).sort({ createdAt: 1 });

            console.log('   Wallets:');
            wallets.forEach((w, i) => {
                console.log(`   ${i + 1}. ID: ${w._id} | Balance: ₹${w.balance} | Created: ${w.createdAt}`);
            });

            // Keep the oldest wallet (first one)
            const keepWallet = wallets[0];
            const deleteWallets = wallets.slice(1);

            console.log(`\n   ✅ Keeping: ${keepWallet._id} (oldest)`);
            console.log(`   ❌ Deleting: ${deleteWallets.length} duplicate(s)`);

            // Calculate total balance from all wallets
            const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
            const totalAvailable = wallets.reduce((sum, w) => sum + w.availableBalance, 0);
            const totalLocked = wallets.reduce((sum, w) => sum + w.lockedBalance, 0);
            const totalLifetime = wallets.reduce((sum, w) => sum + w.lifetimeEarnings, 0);

            console.log(`\n   💰 Merging balances:`);
            console.log(`      Total Balance: ₹${totalBalance}`);
            console.log(`      Available: ₹${totalAvailable}`);
            console.log(`      Locked: ₹${totalLocked}`);
            console.log(`      Lifetime: ₹${totalLifetime}`);

            // Update the wallet to keep with merged balances
            keepWallet.balance = totalBalance;
            keepWallet.availableBalance = totalAvailable;
            keepWallet.lockedBalance = totalLocked;
            keepWallet.lifetimeEarnings = totalLifetime;
            await keepWallet.save();

            console.log(`   ✅ Updated wallet ${keepWallet._id} with merged balances`);

            // Update all transactions to point to the kept wallet
            for (const delWallet of deleteWallets) {
                const txCount = await WalletTransaction.countDocuments({ walletId: delWallet._id });

                if (txCount > 0) {
                    console.log(`   🔄 Updating ${txCount} transactions from ${delWallet._id} to ${keepWallet._id}`);
                    await WalletTransaction.updateMany(
                        { walletId: delWallet._id },
                        { $set: { walletId: keepWallet._id } }
                    );
                }

                // Delete the duplicate wallet
                await Wallet.deleteOne({ _id: delWallet._id });
                console.log(`   ✅ Deleted duplicate wallet: ${delWallet._id}`);
            }

            console.log(`   ✅ Driver ${driverId} cleanup complete!`);
        }

        // Check for multiple company wallets
        console.log('\n\n🔍 Checking for multiple company wallets...');
        const companyWallets = await Wallet.find({ type: 'company' }).sort({ createdAt: 1 });

        if (companyWallets.length > 1) {
            console.log(`⚠️  Found ${companyWallets.length} company wallets`);
            console.log('   Wallets:');
            companyWallets.forEach((w, i) => {
                console.log(`   ${i + 1}. ID: ${w._id} | Balance: ₹${w.balance} | Created: ${w.createdAt}`);
            });

            const keepCompany = companyWallets[0];
            const deleteCompany = companyWallets.slice(1);

            console.log(`\n   ✅ Keeping: ${keepCompany._id} (oldest)`);
            console.log(`   ❌ Deleting: ${deleteCompany.length} duplicate(s)`);

            // Merge balances
            const totalCompanyBalance = companyWallets.reduce((sum, w) => sum + w.balance, 0);
            const totalCompanyAvailable = companyWallets.reduce((sum, w) => sum + w.availableBalance, 0);
            const totalCompanyLifetime = companyWallets.reduce((sum, w) => sum + w.lifetimeEarnings, 0);

            keepCompany.balance = totalCompanyBalance;
            keepCompany.availableBalance = totalCompanyAvailable;
            keepCompany.lifetimeEarnings = totalCompanyLifetime;
            await keepCompany.save();

            console.log(`   ✅ Updated company wallet with merged balances`);

            // Update transactions and delete duplicates
            for (const delCompany of deleteCompany) {
                const txCount = await WalletTransaction.countDocuments({ walletId: delCompany._id });

                if (txCount > 0) {
                    console.log(`   🔄 Updating ${txCount} transactions`);
                    await WalletTransaction.updateMany(
                        { walletId: delCompany._id },
                        { $set: { walletId: keepCompany._id } }
                    );
                }

                await Wallet.deleteOne({ _id: delCompany._id });
                console.log(`   ✅ Deleted duplicate company wallet: ${delCompany._id}`);
            }
        } else {
            console.log('✅ Only one company wallet found\n');
        }

        console.log('\n═══════════════════════════════════════════════════════');
        console.log('🎉 CLEANUP COMPLETE!');
        console.log('═══════════════════════════════════════════════════════');
        console.log('✅ All duplicate wallets merged and deleted');
        console.log('✅ Balances preserved');
        console.log('✅ Transactions updated');
        console.log('\n💡 Next step: Run create-wallet-unique-indexes.js');
        console.log('═══════════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

cleanupDuplicateWallets();
