# 🚀 EAS Build Setup - Manual Steps Required

## ✅ What's Ready
- [x] `app.config.js` configured
- [x] `google-services.json` added ✅ (I can see it's in your open files!)
- [x] EAS CLI installed

---

## 🔴 NEXT: Login to EAS (Manual Step Required)

### Option 1: Login via Browser (Recommended)
```bash
eas login
```

This will:
1. Open your browser
2. Ask you to login with your Expo account
3. Authenticate the CLI

**If you don't have an Expo account:**
- Go to https://expo.dev/signup
- Create a free account
- Then run `eas login`

### Option 2: Login with Username/Password
```bash
eas login --username your-expo-username --password your-password
```

---

## ⏭️ After Login: Configure Build

Once logged in, run:

```bash
cd my-app
eas build:configure
```

**When prompted:**
- ✅ "Generate a new Android Keystore?" → **Yes**
- ✅ "Would you like to automatically create an EAS project?" → **Yes**

This creates `eas.json` with build profiles.

---

## 📋 Expected `eas.json` Output

```json
{
  "cli": {
    "version": ">= 13.2.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 🎯 After Configuration: Build Preview APK

```bash
# Build a test APK (takes 10-20 minutes)
eas build --platform android --profile preview
```

**This will:**
1. ✅ Upload your code to EAS servers
2. ✅ Install dependencies
3. ✅ Generate Android keystore (first time)
4. ✅ Build APK
5. ✅ Provide download link

**Download the APK and test on a real Android device.**

---

## 🔐 Verify Before Building

Run this checklist:

```bash
# 1. Check you're logged in
eas whoami

# 2. Verify google-services.json exists
ls google-services/google-services.json

# 3. Check .env has API key
cat .env | grep GOOGLE_MAPS

# 4. Verify app.config.js is valid
npx expo config --type public
```

---

## 🚨 Common Login Issues

### "Browser doesn't open"
→ Copy the URL from terminal and paste in browser manually

### "Authentication failed"
→ Create account at https://expo.dev/signup first
→ Then run `eas login` again

### "Command not found: eas"
→ Run `npm install -g eas-cli` again
→ Restart your terminal

---

## 📞 Next Steps

1. **Run:** `eas login` (browser will open)
2. **Login** with your Expo account
3. **Run:** `eas build:configure`
4. **Run:** `eas build --platform android --profile preview`
5. **Wait** 10-20 minutes for build
6. **Download** APK from link provided
7. **Test** on real Android device

---

## 🎉 After Successful Build

You'll get:
- ✅ Download link for APK
- ✅ Build ID (for tracking)
- ✅ Android keystore (stored securely by EAS)

**Test the APK thoroughly:**
- [ ] App opens without crashing
- [ ] Location permissions work
- [ ] Google Sign-In works
- [ ] Maps render correctly
- [ ] Can book a ride
- [ ] Push notifications work

---

**Ready to proceed? Run `eas login` in your terminal now!**
