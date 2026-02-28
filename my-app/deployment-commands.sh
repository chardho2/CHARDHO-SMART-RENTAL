#!/bin/bash
# Chardhogo Deployment Commands - Quick Reference

echo "🚀 Chardhogo Deployment Commands"
echo "=================================="
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null
then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
else
    echo "✅ EAS CLI installed"
fi

echo ""
echo "📋 Available Commands:"
echo ""
echo "1. Configure EAS Build (first time only):"
echo "   eas build:configure"
echo ""
echo "2. Build Preview APK (for testing):"
echo "   eas build --platform android --profile preview"
echo ""
echo "3. Build Production AAB (for Play Store):"
echo "   eas build --platform android --profile production"
echo ""
echo "4. Check build status:"
echo "   eas build:list"
echo ""
echo "5. Submit to Play Store (after first manual upload):"
echo "   eas submit --platform android --profile production"
echo ""
echo "6. Create OTA update (for minor changes):"
echo "   eas update --branch production --message 'Bug fixes'"
echo ""
echo "7. Check credentials:"
echo "   eas credentials"
echo ""
echo "8. Login to EAS:"
echo "   eas login"
echo ""
echo "9. Check who's logged in:"
echo "   eas whoami"
echo ""
echo "=================================="
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
