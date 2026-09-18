#!/bin/sh
set -eu

project_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
keystore_path="$project_dir/android/app/arrow-escape-upload.keystore"
properties_path="$project_dir/android/keystore.properties"

if [ -e "$keystore_path" ] || [ -e "$properties_path" ]; then
  echo "Upload-key files already exist; refusing to overwrite them." >&2
  exit 1
fi

store_password=$(openssl rand -base64 36 | tr -d '/+=' | cut -c1-32)
key_password=$store_password

keytool -genkeypair \
  -v \
  -keystore "$keystore_path" \
  -storepass "$store_password" \
  -alias arrow-escape-upload \
  -keypass "$key_password" \
  -keyalg RSA \
  -keysize 4096 \
  -validity 10000 \
  -dname "CN=Arrow Escape Upload, OU=Mobile, O=Aditya Jaiswal, L=Unknown, ST=Unknown, C=IN"

umask 077
{
  printf 'storeFile=app/arrow-escape-upload.keystore\n'
  printf 'storePassword=%s\n' "$store_password"
  printf 'keyAlias=arrow-escape-upload\n'
  printf 'keyPassword=%s\n' "$key_password"
} > "$properties_path"

echo "Created private upload key and local signing properties. Back up both files securely."
