# RoofDynamics Field — Android (Capacitor)

This folder is a Capacitor Android project. It is consumed by `npm run cap:sync`
after a `npm run build`. The Gradle wrapper and Capacitor-generated wiring are
added by `npx cap add android` (see `../docs/GOOGLE_PLAY_RELEASE.md`).

## One-time setup
```bash
cd frontend
npm install
npm run build
npm run cap:add:android        # generates the wrapper + Capacitor wiring
npm run cap:sync               # copies web assets + plugins
npm run cap:open               # opens Android Studio
```

## Running on a device/emulator
```bash
npm run build:android
npx cap run android
```

## Building a release AAB (Google Play)
```bash
export ROOFDYNAMICS_KEYSTORE_PATH=/path/to/keystore.jks
export ROOFDYNAMICS_KEYSTORE_PASSWORD=...
export ROOFDYNAMICS_KEY_ALIAS=roofdynamics
export ROOFDYNAMICS_KEY_PASSWORD=...
cd android
./gradlew bundleRelease
# output: app/build/outputs/bundle/release/app-release.aab
```

## Icons
Replace `app/src/main/res/mipmap-*/ic_launcher*.png` with your final brand icons.
Source art: `frontend/public/pwa-512x512.png` (512x512) — generate adaptive
icon variants with https://icon.kitchen or Android Studio's Image Asset tool.
