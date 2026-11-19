# Google Play Store Assets

Drop final marketing assets here before submission. Filenames expected by the
Play Console upload flow:

- `icon-512.png` — 512x512 app icon (PNG, no alpha issues)
- `feature-graphic-1024x500.png` — feature graphic
- `screenshot-phone-*.png` — at least 2 phone screenshots (16:9 or 9:16)
- `screenshot-tablet-*.png` — optional tablet screenshots

Source art: `frontend/public/icon-source.svg` (512x512). Regenerate all icons
and the feature graphic with `bash scripts/generate-icons.sh` (requires
`rsvg-convert` / librsvg).

Screenshots (phone + tablet, at least 2 each) must be captured from a running
build in Android Studio / an emulator and dropped here as
`screenshot-phone-*.png` / `screenshot-tablet-*.png`.
Listing copy lives in `fastlane/metadata/android/en-US/` (title, short
description, full description) and is consumable by fastlane supply.
