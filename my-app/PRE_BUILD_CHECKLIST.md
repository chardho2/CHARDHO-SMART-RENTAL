# ✅ PRE-BUILD CHECKLIST - Chardhogo

## 🎯 Current Status

### ✅ COMPLETED
- [x] `app.config.js` configured for production
- [x] `google-services.json` added and valid
- [x] EAS CLI installed
- [x] Package name matches: `com.chardhogo.app`
- [x] Firebase project created: `chardhogo-8b016`

### 📦 Assets Status

#### ✅ Available:
- [x] `logo.png` ✅
- [x] `splash-icon.png` ✅
- [x] `favicon.png` ✅
- [x] `android-icon-foreground.png` ✅
- [x] `android-icon-background.png` ✅
- [x] `android-icon-monochrome.png` ✅

#### ⚠️ Missing (Optional but Recommended):
- [ ] `notification-icon.png` (96x96, white on transparent)
  - **Impact:** Default notification icon will be used
  - **Fix:** Create a simple white icon on transparent background
  - **Not blocking:** Build will succeed without it

---

## 🔴 REQUIRED: Manual Steps

### 1. Login to EAS (Interactive - Do This Now)

```bash
eas login
```

**This will open your browser for authentication.**

If you don't have an Expo account:
1. Go to https://expo.dev/signup
2. Create free account
3. Then run `eas login`

---

### 2. Enable Firebase Services

Go to: https://console.firebase.google.com/project/chardhogo-8b016

#### Enable Authentication:
1. Click **"Authentication"** in left menu
2. Click **"Get Started"**
3. Click **"Google"** provider
4. Toggle **"Enable"**
5. Enter support email
6. Click **"Save"**

#### Enable Cloud Messaging (Push Notifications):
1. Click **"Cloud Messaging"** in left menu
2. Note your **Server Key** (you'll need this later)

---

### 3. Enable Google Maps API

Go to: https://console.cloud.google.com/

1. Select project: **chardhogo-8b016**
2. Go to **"APIs & Services"** → **"Library"**
3. Search: **"Maps SDK for Android"**
4. Click **"Enable"**

---

### 4. Verify Environment Variables

Check your `.env` file has:

```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyBOzuhYXUCkUm2JhHXYYjidQzZUtsjii1M
EXPO_PUBLIC_API_URL=http://192.168.0.115:4000/api
```

⚠️ **For production build, change API_URL to your live server!**

---

## 🚀 BUILD COMMANDS

### After completing manual steps above:

```bash
# 1. Verify login
eas whoami

# 2. Configure EAS Build (first time only)
eas build:configure

# 3. Build Preview APK (for testing)
eas build --platform android --profile preview

# 4. Wait 10-20 minutes for build to complete

# 5. Download APK from link provided

# 6. Test on real Android device
```

---

## 📋 Pre-Build Verification Commands

Run these to verify everything is ready:

```bash
# Check EAS login
eas whoami

# Verify google-services.json exists
ls google-services/google-services.json

# Check app.config.js is valid
npx expo config --type public

# Verify package.json dependencies
npm list expo expo-location expo-notifications

# Check .env variables
cat .env
```

---

## 🎯 Expected Build Process

When you run `eas build --platform android --profile preview`:

1. ✅ **Upload** - Code uploaded to EAS servers (~30 seconds)
2. ✅ **Install** - Dependencies installed (~2-3 minutes)
3. ✅ **Keystore** - Android keystore generated (first time only)
4. ✅ **Prebuild** - Native code generated (~1-2 minutes)
5. ✅ **Build** - APK compiled (~5-10 minutes)
6. ✅ **Upload** - APK uploaded to EAS servers (~1 minute)
7. ✅ **Complete** - Download link provided

**Total time: 10-20 minutes**

---

## 🧪 Testing Checklist

After downloading APK, test these features:

### Critical Features:
- [ ] App opens without crashing
- [ ] Location permission prompt appears
- [ ] Location tracking works
- [ ] Google Sign-In works
- [ ] Google Maps renders correctly
- [ ] Can search for locations
- [ ] Can book a ride
- [ ] Push notifications work (if configured)

### UI/UX:
- [ ] Splash screen displays correctly
- [ ] App icon looks good
- [ ] No layout issues
- [ ] All buttons work
- [ ] Navigation works

---

## ⚠️ Common Build Errors

### "google-services.json not found"
✅ **Fixed** - File exists at correct path

### "Invalid package name"
✅ **Fixed** - Matches in both files: `com.chardhogo.app`

### "Expo account not found"
→ Run `eas login` first
→ Create account at https://expo.dev/signup

### "Build failed: Gradle error"
→ Usually means dependency conflict
→ Share full error message for debugging

### "Maps not showing in app"
→ Enable "Maps SDK for Android" in Google Cloud Console
→ Verify API key in `.env`

---

## 🎉 After Successful Build

You'll receive:
- ✅ **Download link** for APK
- ✅ **Build ID** (e.g., `abc123-def456`)
- ✅ **Build logs** (for debugging if needed)
- ✅ **Keystore** (stored securely by EAS)

**Download the APK and install on Android device:**
```bash
# Enable "Install from Unknown Sources" on your Android device
# Transfer APK via USB or download directly
# Install and test
```

---

## 📊 Build Status Tracking

```bash
# Check build status
eas build:list

# View specific build
eas build:view BUILD_ID

# Cancel running build
eas build:cancel BUILD_ID
```

---

## 🔄 For Future Builds

### Update Version:
Edit `app.config.js`:
```javascript
version: "1.0.1",  // Increment
android: {
    versionCode: 2  // Must increment
}
```

Or use auto-increment in `eas.json`:
```json
"production": {
    "autoIncrement": true
}
```

### Rebuild:
```bash
eas build --platform android --profile preview
```

---

## 🚨 IMPORTANT NOTES

### Production vs Preview:
- **Preview** → APK (for testing, easy to install)
- **Production** → AAB (for Play Store, optimized)

### API URL:
Current: `http://192.168.0.115:4000/api` (local)
**Change to production URL before Play Store release!**

### Security:
- ✅ `usesCleartextTraffic: false` (enforces HTTPS)
- ✅ `google-services.json` in `.gitignore`
- ✅ API keys in environment variables

---

## ✅ READY TO BUILD?

**Checklist:**
- [x] `google-services.json` valid
- [x] All required assets present
- [x] `app.config.js` configured
- [ ] **EAS login complete** ← DO THIS NOW
- [ ] **Firebase Auth enabled** ← DO THIS NOW
- [ ] **Maps API enabled** ← DO THIS NOW

**Next command:**
```bash
eas login
```

Then follow the steps in `EAS_LOGIN_GUIDE.md`!
