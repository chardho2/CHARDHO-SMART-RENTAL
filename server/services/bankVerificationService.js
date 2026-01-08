const Driver = require('../models/Driver');

/**
 * BANK VERIFICATION SERVICE
 * Handles bank account verification logic
 */

/**
 * Verify bank account details
 * @param {Object} driver - Driver document
 * @returns {Object} - Verification result
 */
const verifyBankAccount = async (driver) => {
    // TODO: Integrate real bank verification API (Razorpay, Cashfree, etc.)
    // For now, we validate format and mark as verified

    const { accountNumber, ifscCode, accountHolderName } = driver.bankDetails;

    // Basic validation
    if (!accountNumber || !ifscCode || !accountHolderName) {
        return {
            success: false,
            message: 'Incomplete bank details',
            status: 'failed'
        };
    }

    // IFSC format validation
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifscCode)) {
        return {
            success: false,
            message: 'Invalid IFSC code format',
            status: 'failed'
        };
    }

    // Mark as verified (placeholder until real API integration)
    driver.bankDetails.verificationStatus = 'verified';
    driver.bankDetails.verifiedAt = new Date();
    driver.bankDetails.beneficiaryId = `BENE_${driver._id}_${Date.now()}`;

    await driver.save();

    return {
        success: true,
        message: 'Bank details verified successfully',
        status: 'verified',
        verifiedAt: driver.bankDetails.verifiedAt
    };
};

/**
 * Get bank details for a driver
 * @param {String} driverId - Driver ID
 * @returns {Object} - Bank details
 */
const getBankDetails = async (driverId) => {
    const driver = await Driver.findById(driverId).select('bankDetails');

    if (!driver || !driver.bankDetails) {
        return null;
    }

    return driver.bankDetails;
};

/**
 * Update bank details for a driver
 * @param {String} driverId - Driver ID
 * @param {Object} details - Bank details
 * @returns {Object} - Updated driver
 */
const updateBankDetails = async (driverId, details) => {
    const driver = await Driver.findById(driverId);

    if (!driver) {
        throw new Error('Driver not found');
    }

    // Initialize bankDetails if it doesn't exist
    if (!driver.bankDetails) {
        driver.bankDetails = {};
    }

    // Update individual fields
    driver.bankDetails.accountNumber = details.accountNumber;
    driver.bankDetails.ifscCode = details.ifscCode.toUpperCase();
    driver.bankDetails.accountHolderName = details.accountHolderName;
    driver.bankDetails.verificationStatus = 'pending';
    driver.bankDetails.verifiedAt = null;
    driver.bankDetails.beneficiaryId = null;

    // Mark the nested path as modified for Mongoose
    driver.markModified('bankDetails');

    await driver.save();

    console.log('✅ Bank details saved:', {
        accountNumber: driver.bankDetails.accountNumber,
        ifscCode: driver.bankDetails.ifscCode,
        accountHolderName: driver.bankDetails.accountHolderName
    });

    return driver;
};

/**
 * Delete bank details for a driver
 * @param {String} driverId - Driver ID
 * @returns {Object} - Updated driver
 */
const deleteBankDetails = async (driverId) => {
    const driver = await Driver.findById(driverId);

    if (!driver) {
        throw new Error('Driver not found');
    }

    driver.bankDetails = undefined;
    await driver.save();

    return driver;
};

module.exports = {
    verifyBankAccount,
    getBankDetails,
    updateBankDetails,
    deleteBankDetails
};
