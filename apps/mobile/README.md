# @lotto/mobile

Expo + React Native Android app for Lotto Helper.

This app lives separately from the web portal:

- `apps/web` remains the Vite web portal
- `apps/mobile` is the Android/iOS-capable Expo app

## Android device testing

Install dependencies from the repo root:

```bash
npm install
```

Connect your Android device, enable Developer Options and USB debugging, then confirm the Mac is authorized:

```bash
adb devices
```

Start the Android app from the repo root:

```bash
npm run dev:android
```

Build an installable APK from the repo root:

```bash
npm run build:android
```

The generated APK is:

```bash
apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

Install the app on a connected Android device:

```bash
npm run install:android
```

Or from this folder:

```bash
npm run android
```

Expo will open the app on the connected Android device when the device is visible to ADB. If the device is not listed, reconnect the cable, unlock the phone, and accept the USB debugging authorization prompt.

The default build/install scripts use the release variant so the JavaScript bundle is packaged into the APK. The debug variant requires Metro to be running on port `8081`.

## API configuration

By default the app uses:

```bash
https://lotto-lucky888.vercel.app/api
```

To point the app at another API during development:

```bash
EXPO_PUBLIC_API_BASE_URL=http://YOUR_MAC_LAN_IP:3002/api npm run dev:android
```

Use the Mac's LAN IP address instead of `localhost`, because `localhost` on Android means the phone itself.
