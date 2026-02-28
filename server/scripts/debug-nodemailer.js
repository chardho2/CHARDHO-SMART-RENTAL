const nodemailer = require('nodemailer');

console.log('Type of nodemailer:', typeof nodemailer);
console.log('Keys:', Object.keys(nodemailer));

if (typeof nodemailer.createTransporter === 'function') {
    console.log('✅ createTransporter IS a function');
} else {
    console.log('❌ createTransporter is NOT a function');
    console.log('Value of createTransporter:', nodemailer.createTransporter);
}

try {
    const pkg = require('nodemailer/package.json');
    console.log('Nodemailer version:', pkg.version);
} catch (e) {
    console.log('Could not load package.json');
}
