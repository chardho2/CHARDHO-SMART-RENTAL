# Notification Icon Missing

The build requires `notification-icon.png` (96x96, white on transparent background).

## Quick Fix Options:

### Option 1: Use logo.png as temporary placeholder
```bash
# Copy logo.png as notification-icon.png
cp assets/images/logo.png assets/images/notification-icon.png
```

### Option 2: Create proper notification icon
Use an online tool:
1. Go to: https://romannurik.github.io/AndroidAssetStudio/icons-notification.html
2. Upload your logo
3. Download generated icon
4. Save as `assets/images/notification-icon.png`

### Option 3: Skip for now
The build will use a default icon. You can update it later.

## For now, let's use logo.png as placeholder:
