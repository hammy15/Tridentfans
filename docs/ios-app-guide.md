# TridentFans iOS App Guide

## Overview

The TridentFans iOS app is a hybrid app built with Capacitor, wrapping the existing web application into a native iOS shell. This provides a native app experience while reusing all existing code.

## Prerequisites

1. **Apple Developer Account** ($99/year)
   - Sign up at [developer.apple.com](https://developer.apple.com)

2. **Xcode** (free from Mac App Store)
   - Install from the Mac App Store
   - Requires macOS Monterey or later

3. **Node.js & npm**
   - Already installed for web development

## Quick Start

### Build & Test Locally

```bash
# Sync the project
npx cap sync ios

# Open in Xcode
npx cap open ios
```

Or use the build script:

```bash
chmod +x scripts/build-ios.sh
./scripts/build-ios.sh
```

### Configure in Xcode

1. **Open the project**: The `ios/App/App.xcworkspace` file
2. **Select your Team**:
   - Click on "App" in the project navigator
   - Go to "Signing & Capabilities"
   - Select your Apple Developer Team
3. **Set Bundle Identifier**: `com.tridentfans.app`
4. **Run on Simulator**: Select iPhone from the device dropdown, press ⌘R

## App Store Submission

### 1. Prepare App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create a new app:
   - **Name**: TridentFans
   - **Bundle ID**: com.tridentfans.app
   - **SKU**: tridentfans-ios-001
   - **Primary Language**: English (US)

### 2. App Information

Fill out the required information:

**App Store Information:**
- **Name**: TridentFans - Mariners Fan Community
- **Subtitle**: Predictions, Chat & Forums
- **Category**: Sports
- **Secondary Category**: Entertainment

**Description** (4000 char max):
```
TridentFans is the ultimate Seattle Mariners fan community app!

FEATURES:
🔮 Predictions - Make daily picks for every Mariners game. Compete on leaderboards!
🤖 AI Chatbots - Chat with Moose (the expert), Captain Hammy (the strategist), and Spartan (the debater)
💬 Forums - Discuss games, trades, and hot takes with fellow fans
📰 News - Stay updated with the latest Mariners news
📊 Live Stats - Real-time scores, standings, and player stats

Whether you're a lifelong fan or just discovering the Mariners, TridentFans is your home base for all things Seattle baseball. Sea Us Rise! 🔱

Features:
• Make game predictions and climb the leaderboard
• Chat with AI-powered Mariners experts
• Join community discussions in the forum
• Get real-time game updates and scores
• Track your prediction accuracy over the season

Go Mariners! 🔱⚾
```

**Keywords** (100 char max):
```
Mariners,Seattle,MLB,baseball,predictions,fans,sports,community,forum,scores
```

**Support URL**: https://tridentfans.com
**Marketing URL**: https://tridentfans.com

### 3. Screenshots

Required sizes:
- **iPhone 6.9"** (1320 x 2868): iPhone 15 Pro Max
- **iPhone 6.5"** (1284 x 2778): iPhone 14 Pro Max
- **iPad Pro 13"** (2064 x 2752): iPad Pro

Capture screenshots of:
1. Home page with live game
2. Predictions page
3. Bot chat interface
4. Forum discussions
5. Leaderboard

### 4. Build for Release

In Xcode:
1. Select "Any iOS Device (arm64)" as the build target
2. Go to **Product → Archive**
3. Once archived, click **Distribute App**
4. Select **App Store Connect**
5. Follow the prompts to upload

### 5. Submit for Review

1. In App Store Connect, go to your app
2. Add the build you just uploaded
3. Complete all required fields
4. Submit for review

**Review typically takes 1-3 days**

## App Configuration

### Bundle Identifier
`com.tridentfans.app`

### Version
Update in `ios/App/App.xcodeproj/project.pbxproj`:
- MARKETING_VERSION = 1.0.0
- CURRENT_PROJECT_VERSION = 1

### Capabilities Enabled
- Push Notifications
- Background Fetch
- Remote Notifications

## Updating the App

When you make changes to the web app:

```bash
# The app loads from tridentfans.com directly
# No rebuild needed for web changes!

# For native changes (icons, splash, etc.):
npx cap sync ios
npx cap open ios
# Then archive and upload in Xcode
```

## Troubleshooting

### "Signing for App requires a development team"
- Open Xcode → Select App project → Signing & Capabilities → Select your team

### "Unable to install App"
- Make sure your device is registered in your Apple Developer account
- Go to developer.apple.com → Certificates → Devices → Add your device UDID

### App shows blank screen
- Check that https://tridentfans.com is accessible
- Verify the server URL in capacitor.config.ts

### Push notifications not working
- Enable Push Notifications in App Store Connect
- Generate APNs key in Apple Developer Portal
- Configure in your backend

## Files Structure

```
ios/
├── App/
│   ├── App/
│   │   ├── Assets.xcassets/      # App icons & splash
│   │   ├── Info.plist            # App configuration
│   │   └── public/               # Web assets (minimal)
│   ├── App.xcodeproj/            # Xcode project
│   └── App.xcworkspace/          # Open this in Xcode
└── Podfile                       # iOS dependencies
```

## Privacy Policy

Required for App Store. Create at:
https://tridentfans.com/privacy

Include:
- Data collection practices
- Third-party services used
- Contact information

## Support

For issues with the iOS app:
- GitHub: https://github.com/hammy15/tridentfans/issues
- Email: support@tridentfans.com
