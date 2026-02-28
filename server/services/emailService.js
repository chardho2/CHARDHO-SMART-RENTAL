const nodemailer = require('nodemailer');

/**
 * Email Service for sending password reset emails
 * 
 * Setup:
 * 1. Install: npm install nodemailer
 * 2. Add to .env:
 *    EMAIL_HOST=smtp.gmail.com
 *    EMAIL_PORT=587
 *    EMAIL_USER=your-email@gmail.com
 *    EMAIL_PASSWORD=your-app-password
 *    EMAIL_FROM=CharDhoGo <noreply@chardhogo.com>
 */

// Create reusable transporter
const createTransporter = () => {
    // If no email credentials, force console logging mode
    if (!process.env.EMAIL_USER) {
        console.log('⚠️  Email not configured (EMAIL_USER missing). Using console logging instead.');
        return null; // Return null to trigger console logging in sendPasswordResetEmail
    }

    try {
        // Check if nodemailer is valid
        if (typeof nodemailer.createTransporter !== 'function') {
            console.error('❌ Nodemailer library issue: createTransporter is not a function');
            console.log('⚠️  Falling back to console logging due to library error.');
            return null;
        }

        return nodemailer.createTransporter({
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.EMAIL_PORT) || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    } catch (error) {
        console.error('❌ Failed to create email transporter:', error.message);
        return null;
    }
};

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {string} resetUrl - Password reset URL/deep link
 * @param {string} resetToken - Reset token (for display in email)
 */
const sendPasswordResetEmail = async (email, name, resetUrl, resetToken) => {
    const transporter = createTransporter();

    // If no transporter (development mode), just log
    if (!transporter) {
        console.log('\n');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📧  PASSWORD RESET EMAIL (Development Mode)');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('');
        console.log(`👤 Recipient: ${name} <${email}>`);
        console.log('');
        console.log('🔐 RESET TOKEN (Enter in app):');
        console.log(`   ${resetToken.substring(0, 8).toUpperCase()}`);
        console.log('');
        console.log('🔗 RESET LINK (Click or copy):');
        console.log(`   ${resetUrl}`);

        // Generate Expo Go link for easy testing (replace scheme and prepend host)
        const expoLink = resetUrl.replace('chardhogo://', 'exp://192.168.29.199:8081/--/');
        // Generate Standard Web link for reference
        const webLink = resetUrl.replace('chardhogo://', 'https://chardhogo.com/');

        console.log('');
        console.log('📱 EXPO GO LINK (For testing in Expo Go):');
        console.log(`   ${expoLink}`);
        console.log('');
        console.log('🌐 WEB FORMAT (For reference):');
        console.log(`   ${webLink}`);
        console.log('');
        console.log('📋 FULL TOKEN (For testing):');
        console.log(`   ${resetToken}`);
        console.log('');
        console.log('⏰ Expires: 1 hour from now');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('\n');
        return { success: true, message: 'Email logged to console (development mode)' };
    }

    // Email HTML template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .container {
            background: linear-gradient(135deg, #4FD1C5 0%, #38B2AC 100%);
            border-radius: 10px;
            padding: 30px;
            margin: 20px 0;
        }
        .content {
            background: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            color: #4FD1C5;
            margin-bottom: 10px;
        }
        h1 {
            color: #2D3748;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .token-box {
            background: #F7FAFC;
            border: 2px dashed #4FD1C5;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 25px 0;
        }
        .token {
            font-size: 28px;
            font-weight: bold;
            color: #2D3748;
            letter-spacing: 3px;
            font-family: 'Courier New', monospace;
        }
        .button {
            display: inline-block;
            background: linear-gradient(135deg, #4FD1C5 0%, #38B2AC 100%);
            color: white;
            text-decoration: none;
            padding: 15px 40px;
            border-radius: 8px;
            font-weight: bold;
            margin: 20px 0;
            text-align: center;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #E2E8F0;
            color: #718096;
            font-size: 14px;
        }
        .warning {
            background: #FFF5F5;
            border-left: 4px solid #FC8181;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info {
            background: #EBF8FF;
            border-left: 4px solid #4299E1;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="content">
            <div class="header">
                <div class="logo">🚗 CharDhoGo</div>
            </div>
            
            <h1>Reset Your Password</h1>
            
            <p>Hi ${name},</p>
            
            <p>We received a request to reset your password. If you didn't make this request, you can safely ignore this email.</p>
            
            <div class="info">
                <strong>🔐 Your Reset Token:</strong>
                <div class="token-box">
                    <div class="token">${resetToken.substring(0, 8).toUpperCase()}</div>
                </div>
                <p style="margin: 0; font-size: 14px;">Enter this code in the app to reset your password.</p>
            </div>
            
            <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password in App</a>
            </p>
            
            <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>This link expires in 1 hour</li>
                    <li>Never share this code with anyone</li>
                    <li>CharDhoGo will never ask for your password via email</li>
                </ul>
            </div>
            
            <div class="footer">
                <p><strong>CharDhoGo</strong> - Your Trusted Ride Partner</p>
                <p>If you didn't request this email, please ignore it or contact support.</p>
                <p style="font-size: 12px; color: #A0AEC0;">
                    This is an automated email. Please do not reply.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `;

    // Plain text version
    const textContent = `
Reset Your Password - CharDhoGo

Hi ${name},

We received a request to reset your password.

Your Reset Token: ${resetToken.substring(0, 8).toUpperCase()}

Or click this link to reset in the app:
${resetUrl}

This link expires in 1 hour.

Security Notice:
- Never share this code with anyone
- CharDhoGo will never ask for your password via email
- If you didn't request this, please ignore this email

---
CharDhoGo - Your Trusted Ride Partner
    `;

    // Send email
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"CharDhoGo" <noreply@chardhogo.com>',
            to: email,
            subject: '🔐 Reset Your Password - CharDhoGo',
            text: textContent,
            html: htmlContent
        });

        console.log(`✅ Email sent: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email sending error:', error);
        throw new Error(`Failed to send email: ${error.message}`);
    }
};

/**
 * Send welcome email (optional)
 */
const sendWelcomeEmail = async (email, name) => {
    const transporter = createTransporter();

    if (!transporter) {
        console.log(`📧 Welcome email would be sent to: ${email}`);
        return { success: true };
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4FD1C5 0%, #38B2AC 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #4FD1C5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚗 Welcome to CharDhoGo!</h1>
        </div>
        <div class="content">
            <p>Hi ${name},</p>
            <p>Welcome to CharDhoGo! We're excited to have you on board.</p>
            <p>Start booking rides or driving with us today!</p>
            <p style="text-align: center;">
                <a href="chardhogo://home" class="button">Get Started</a>
            </p>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Happy riding!<br>The CharDhoGo Team</p>
        </div>
    </div>
</body>
</html>
    `;

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"CharDhoGo" <noreply@chardhogo.com>',
            to: email,
            subject: '👋 Welcome to CharDhoGo!',
            html: htmlContent
        });
        return { success: true };
    } catch (error) {
        console.error('Welcome email error:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendPasswordResetEmail,
    sendWelcomeEmail
};
