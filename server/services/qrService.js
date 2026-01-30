const QRCode = require('qrcode');
const crypto = require('crypto');

/**
 * QR SERVICE
 * Generates unique, signed QR codes for drivers
 */

// Secret for signing QR tokens (should be in env)
const QR_SECRET = process.env.QR_SECRET || 'chardhogo_qr_secret_key_2024';

/**
 * Generate a signed token for a driver
 */
const generateDriverToken = (driverId) => {
    const payload = `${driverId}:${Date.now()}`; // DriverID + Creation Timestamp
    const signature = crypto
        .createHmac('sha256', QR_SECRET)
        .update(payload)
        .digest('hex');

    // Return Base64 encoded payload + signature
    return Buffer.from(`${payload}.${signature}`).toString('base64');
};

/**
 * Verify a driver token
 */
const verifyDriverToken = (token) => {
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        const [payload, signature] = decoded.split('.');
        const [driverId, timestamp] = payload.split(':');

        const expectedSignature = crypto
            .createHmac('sha256', QR_SECRET)
            .update(payload)
            .digest('hex');

        if (signature !== expectedSignature) {
            return { valid: false, error: 'Invalid signature' };
        }

        return {
            valid: true,
            driverId,
            timestamp: parseInt(timestamp)
        };
    } catch (error) {
        return { valid: false, error: 'Malformed token' };
    }
};

/**
 * Generate QR Code Data URL
 * @param {String} driverId 
 * @param {String} baseUrl - The base URL for the scan page (e.g., https://app.chardhogo.com/pay)
 */
const generateDriverQR = async (driverId, baseUrl = 'https://chardhogo.com/pay') => {
    // Generate signed token
    const token = generateDriverToken(driverId);

    // Construct the URL embedded in the QR
    // When scanned, this opens the web page with the driver identified
    const qrContent = `${baseUrl}?d=${token}`;

    try {
        // Generate QR as Data URL (can be displayed directly in img tag)
        const qrImage = await QRCode.toDataURL(qrContent, {
            errorCorrectionLevel: 'H',
            margin: 1,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });

        return {
            qrImage,
            qrContent,
            token
        };
    } catch (error) {
        console.error('QR Generation Error:', error);
        throw error;
    }
};

module.exports = {
    generateDriverQR,
    verifyDriverToken
};
