#!/usr/bin/env bash
# Generate a release signing keystore for the RoofDynamics Field Android app.
# NEVER commit the resulting .jks file or passwords. Store them in a password
# manager / CI secret store (see docs/GOOGLE_PLAY_RELEASE.md).
set -euo pipefail

KEYSTORE_PATH="${KEYSTORE_PATH:-./roofdynamics-release.jks}"
KEY_ALIAS="${KEY_ALIAS:-roofdynamics}"
VALIDITY_DAYS="${VALIDITY_DAYS:-10000}"

if [ -f "$KEYSTORE_PATH" ]; then
  echo "ERROR: $KEYSTORE_PATH already exists. Refusing to overwrite." >&2
  exit 1
fi

read -rsp "Keystore password: " STORE_PASS; echo
read -rsp "Key password (Enter to reuse keystore password): " KEY_PASS; echo
[ -z "$KEY_PASS" ] && KEY_PASS="$STORE_PASS"

keytool -genkeypair -v \
  -keystore "$KEYSTORE_PATH" \
  -alias "$KEY_ALIAS" \
  -keyalg RSA -keysize 2048 \
  -validity "$VALIDITY_DAYS" \
  -storepass "$STORE_PASS" \
  -keypass "$KEY_PASS" \
  -dname "CN=RoofDynamics Field, OU=Mobile, O=AusGreek Developments, L=Perth, ST=WA, C=AU"

echo
echo "Created: $KEYSTORE_PATH"
echo "Alias:   $KEY_ALIAS"
echo
echo "Base64 for CI (GitHub secret KEYSTORE_BASE64):"
base64 -w 0 "$KEYSTORE_PATH"; echo
echo
echo "Set these GitHub secrets:"
echo "  KEYSTORE_BASE64        = (above)"
echo "  KEYSTORE_PASSWORD      = $STORE_PASS"
echo "  KEY_ALIAS              = $KEY_ALIAS"
echo "  KEY_PASSWORD           = $KEY_PASS"
