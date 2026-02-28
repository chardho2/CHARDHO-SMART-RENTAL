require('dotenv').config();
const mongoose = require('mongoose');
const Wallet = require('../models/Wallet');

/**
 * SETUP COMPANY WALLET
 * 
 * Run this script ONCE to create the company wallet
 * This wallet receives all commission from rides
 */

async function setupCompanyWallet() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('🏢 Creating company wallet...');
        const companyWallet = await Wallet.getOrCreateCompanyWallet();

        console.log('✅ Company wallet created successfully!');
        console.log('📊 Wallet Details:');
        console.log('   ID:', companyWallet._id);
        console.log('   Type:', companyWallet.type);
        console.log('   Balance: ₹', companyWallet.balance);
        console.log('   Status:', companyWallet.status);
        console.log('   Created:', companyWallet.createdAt);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

setupCompanyWallet();
