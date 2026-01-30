const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const clientId = '84370184248-veifekuomi0v39090epd5d3u4thljpid.apps.googleusercontent.com';

if (fs.existsSync(envPath)) {
    let content = fs.readFileSync(envPath, 'utf8');

    // Replace or Append Android Client ID
    if (content.includes('EXPO_PUBLIC_ANDROID_CLIENT_ID=')) {
        content = content.replace(/EXPO_PUBLIC_ANDROID_CLIENT_ID=.*/g, `EXPO_PUBLIC_ANDROID_CLIENT_ID=${clientId}`);
    } else {
        content += `\nEXPO_PUBLIC_ANDROID_CLIENT_ID=${clientId}`;
    }

    // Replace or Append Web Client ID (User needs this for Expo Go even if targeting Android)
    if (content.includes('EXPO_PUBLIC_WEB_CLIENT_ID=')) {
        content = content.replace(/EXPO_PUBLIC_WEB_CLIENT_ID=.*/g, `EXPO_PUBLIC_WEB_CLIENT_ID=${clientId}`);
    } else {
        content += `\nEXPO_PUBLIC_WEB_CLIENT_ID=${clientId}`;
    }

    fs.writeFileSync(envPath, content);
    console.log('Updated .env with Client ID:', clientId);
} else {
    console.log('.env file not found!');
}
