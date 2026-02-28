# 🚀 Chardhogo Deployment Guide

## ✅ COMPLETED
- [x] Updated `app.config.js` with production configuration
- [x] Created `google-services/` folder
- [x] Added template for `google-services.json`

---

## 🔴 CRITICAL: NEXT STEPS (DO THESE NOW)

### 1. Get Google Services Files from Firebase

**Go to:** https://console.firebase.google.com/

#### For Android (MANDATORY):
1. Create/select project "Chardhogo"
2. Click "Add app" → Select Android
3. Enter package name: `com.chardhogo.app`
4. Download `google-services.json`
5. **REPLACE** `my-app/google-services/google-services.json.TEMPLATE` with the real file
6. Rename it to `google-services.json` (remove .TEMPLATE)

#### For iOS (Optional):
1. In same Firebase project, click "Add app" → Select iOS
2. Enter bundle ID: `com.chardhogo.app`
3. Download `GoogleService-Info.plist`
4. Place in `my-app/google-services/GoogleService-Info.plist`

---

### 2. Enable Firebase Services

In Firebase Console, enable:
- ✅ **Authentication** → Google Sign-In
- ✅ **Cloud Messaging (FCM)** → For push notifications
- ✅ **Google Maps API** → In Google Cloud Console

---

### 3. Create Missing Assets

Run these commands to check which assets exist:

```bash
cd my-app
ls assets/images/
```

**Required files:**
- `logo.png` (1024x1024) - App icon
- `splash-icon.png` (1284x2778) - Splash screen
- `notification-icon.png` (96x96, white on transparent) - Notification icon
- `android-icon-foreground.png` (432x432) - Already exists ✓
- `android-icon-background.png` (432x432) - Already exists ✓
- `android-icon-monochrome.png` (432x432) - Already exists ✓
- `favicon.png` (48x48) - Web favicon

**If missing, create them or use placeholders for now.**

---

### 4. Install EAS CLI and Configure

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Navigate to project
cd my-app

# Configure EAS Build
eas build:configure
```

This will create `eas.json`. Accept defaults.

---

### 5. Test Build (Preview APK)

```bash
# Build a test APK
eas build --platform android --profile preview

# This will:
# - Upload your code to EAS servers
# - Build an APK
# - Provide download link
```

**Download and test the APK on a real Android device.**

---

### 6. Production Build (When Ready)

```bash
# Build production AAB for Play Store
eas build --platform android --profile production
```

---

## 📋 Pre-Build Checklist

Before running `eas build`, verify:

- [ ] `google-services.json` is real (not template)
- [ ] All assets exist in `assets/images/`
- [ ] `.env` has `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] Firebase Authentication is enabled
- [ ] Google Maps API is enabled in Google Cloud Console
- [ ] You're logged into EAS CLI (`eas whoami`)

---

## 🔐 Environment Variables

Your `.env` should have:

```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...your-actual-key
EXPO_PUBLIC_API_URL=http://192.168.0.115:4000/api
```

**For production, change API_URL to your live server.**

---

## ⚠️ Common Issues

### "google-services.json not found"
→ Make sure you downloaded the real file from Firebase and placed it in `google-services/`

### "Google Sign-In not working"
→ Enable Google Authentication in Firebase Console
→ Add SHA-1 fingerprint in Firebase (EAS provides this)

### "Maps not showing"
→ Enable Maps SDK for Android in Google Cloud Console
→ Verify API key in `.env`

---

## 🎯 What Changed in app.config.js

1. ✅ Added `expo-location` plugin with permission strings
2. ✅ Added `expo-notifications` plugin
3. ✅ Added `expo-build-properties` for build optimization
4. ✅ Added all required Android permissions
5. ✅ Added iOS permission strings (infoPlist)
6. ✅ Configured `googleServicesFile` paths
7. ✅ Changed `usesCleartextTraffic` to `false` (security)
8. ✅ Added OTA updates configuration
9. ✅ Added runtime version policy
10. ✅ Added app description

---

## 📞 Need Help?

If you encounter errors during build, share the error message and I'll help debug.

**Next command to run:**
```bash
eas build:configure
```
