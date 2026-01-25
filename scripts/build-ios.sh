#!/bin/bash
# TridentFans iOS Build Script
# Usage: ./scripts/build-ios.sh

set -e

echo "🔱 Building TridentFans iOS App..."

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Sync Capacitor
echo "📱 Syncing Capacitor..."
npx cap sync ios

# Open Xcode
echo "🛠️  Opening Xcode..."
npx cap open ios

echo ""
echo "✅ iOS project ready!"
echo ""
echo "Next steps in Xcode:"
echo "1. Select your Team in Signing & Capabilities"
echo "2. Set your Bundle Identifier (com.tridentfans.app)"
echo "3. Select a device or simulator"
echo "4. Click Run (⌘R) to test"
echo "5. For App Store: Product → Archive"
echo ""
