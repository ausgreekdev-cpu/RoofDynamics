# RoofDynamics Field — Google Play Release Runbook

Android companion app (Capacitor) wrapping the RoofDynamics PWA. Package ID:
`com.ausgreek.roofdynamics`. Target SDK 35, min SDK 26, 64-bit (arm64-v8a,
x86_64) only.

## Prerequisites
- Android Studio (latest) + JDK 17
- Node 20+, npm
- A Google Play Console account + app listing created

## First-time build
```bash
cd frontend
npm install
npm run build
npm run cap:add:android     # one time only
npm run cap:sync
npm run cap:open            # opens Android Studio
```

## Signing keystore (create once, store securely, never commit)
```bash
keytool -genkeypair -v \
  -keystore roofdynamics-release.jks \
  -alias roofdynamics -keyalg RSA -keysize 2048 -validity 10000
```
Store the keystore + passwords in a password manager / CI secret store. Losing
the keystore means losing the ability to update the app on Google Play.

## Build the release AAB
```bash
export ROOFDYNAMICS_KEYSTORE_PATH=/abs/path/roofdynamics-release.jks
export ROOFDYNAMICS_KEYSTORE_PASSWORD=...
export ROOFDYNAMICS_KEY_ALIAS=roofdynamics
export ROOFDYNAMICS_KEY_PASSWORD=...
cd frontend/android
./gradlew bundleRelease
# -> app/build/outputs/bundle/release/app-release.aab
```

## Play Console checklist
- [ ] App listing: title "RoofDynamics Field", short + full description (see `store/`)
- [ ] App icon 512x512 + feature graphic 1024x500 + screenshots (phone + tablet)
- [ ] Privacy policy URL (host `PRIVACY.md` content at a public URL)
- [ ] Data safety form: declare photos, location, contacts, financial data
- [ ] Content rating questionnaire (IARC) — business/productivity app
- [ ] Target audience: not primarily children
- [ ] Upload AAB to Internal testing track first, then Closed/Open testing, then Production
- [ ] Pre-launch report reviewed (Firebase Test Lab)
- [ ] Store listing reviewed for policy compliance (no placeholder content)

## CI
`.github/workflows/android.yml` builds a debug APK on every push and a signed
release AAB on tag push (`v*`). Required secrets:
`KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.

## Notes
- No Firebase/FCM in v1 (push notifications deferred).
- Camera and location permissions are declared optional (`required="false"`) so
  devices without them can still install.
- Cleartext traffic is disabled; the app talks to the HTTPS production origin.
- The web layer is the PWA; native plugins (camera, geo, preferences) are
  lazy-loaded so the web build stays small.
