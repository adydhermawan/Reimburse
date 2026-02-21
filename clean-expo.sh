#!/bin/bash
# 🧹 Ultimate Expo Deep Clean Script
# Cara paling ampuh untuk mereset seluruh cache Expo dan React Native

echo "🧹 1. Membersihkan watchman (jika ada)..."
if command -v watchman &> /dev/null; then
  watchman watch-del-all
else
  echo "Watchman tidak terdeteksi, melanjutkan..."
fi

echo "🗑️  2. Menghapus folder build dan cache (.expo, node_modules, android, ios)..."
rm -rf node_modules
rm -rf .expo
rm -rf android
rm -rf ios
rm -rf package-lock.json
# Hapus cache metro spesifik jika ada
rm -rf $TMPDIR/metro-*

echo "📦 3. Menginstall ulang dependencies (npm install)..."
npm install

echo "⚙️  4. Melakukan prebuild ulang (npx expo prebuild --clean)..."
npx expo prebuild --clean

echo "✅ Selesai! Kamu sekarang dapat mencoba build kembali."
echo ""
echo "👉 Saran perintah build selanjutnya:"
echo "Untuk testing lokal (bundler): npx expo start -c"
echo "Untuk testing native Android : npm run android"
echo "Untuk testing native iOS     : npm run ios"
echo "Untuk build EAS              : eas build -p android --profile development"
