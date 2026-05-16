# lotto-helper

A small Lotto helper app with support for:

- **Lotto Max** — 7 main numbers from 1–50, plus a separate bonus number
- **Lotto 6/49** — 6 main numbers from 1–49, plus a separate bonus number

Project layout:

- `apps/web` — Vite + React frontend
- `apps/api` — Express API
- `apps/mobile` — Expo + React Native app for Android device testing
- `packages/shared` — shared app configuration used by mobile tests

## Development

Install dependencies from the repo root:

```bash
npm install
```

Run the API:

```bash
npm run dev:api
```

Run the web app:

```bash
npm run dev:web
```

By default, the web app expects the API at `http://localhost:3002/api`.

Run the Android app on a connected device:

```bash
npm run dev:android
```

Build the installable Android APK:

```bash
npm run build:android
```

Install the Android app on a connected device:

```bash
npm run install:android
```

The mobile app is separate from the web portal and lives in `apps/mobile`. It uses Expo, so make sure your Android device has USB debugging enabled and appears in `adb devices`.

## Structure

- `apps/web` — frontend
- `apps/api` — backend
- `apps/mobile` — Expo mobile app
- `packages/shared` — shared configuration helpers

## Notes

This repo is being prepared for GitHub first, then likely deployment via Vercel (web) + Railway or similar (API).
