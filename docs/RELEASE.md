# TestFlight and App Store release runbook

This page is the repeatable path from a reviewed commit on `main` to a TestFlight build and, later, an App Store submission. It records what the repository already provides and what only the account owner can do.

## What the repository provides

| Requirement | Where it lives |
| --- | --- |
| App icon (1024 px, opaque) | `AI Petverse/Assets.xcassets/AppIcon.appiconset/`, rendered by `scripts/generate-app-icon.swift` |
| Privacy manifest | `AI Petverse/PrivacyInfo.xcprivacy` (no tracking, no collected data, `UserDefaults` reason `CA92.1`) |
| Export compliance | `ITSAppUsesNonExemptEncryption = NO` in `Info.plist` |
| Versioning | `MARKETING_VERSION` (user-facing, e.g. `0.1.0`) and `CURRENT_PROJECT_VERSION` (build number) build settings |
| Signing | Automatic signing via `Config/Signing.xcconfig`; the team ID stays in the ignored `Config/Signing.local.xcconfig` |
| Device family | iPhone only, portrait. iPad support can be added in a later version; it cannot be removed after release. |
| CLI export settings | `Config/ExportOptions.plist` (App Store Connect upload) |

The placeholder icon is generated from code in this repository and contains no third-party artwork. Regenerate it with:

```bash
swift scripts/generate-app-icon.swift "AI Petverse/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png"
```

## One-time owner setup

These steps need the account owner and cannot be automated from the repository.

1. **Enroll in the Apple Developer Program** (paid, individual or organization). A free Personal Team can run the app on your own device but cannot upload to TestFlight.
2. **Confirm the bundle ID before the first upload.** The project uses `com.tony.aipetverse`. Once an App Store Connect record uses a bundle ID, it cannot be changed. Do not register it from a free Personal Team first.
3. **Set the team locally:**
   ```bash
   cp Config/Signing.local.xcconfig.example Config/Signing.local.xcconfig
   # then replace YOUR_TEAM_ID with the 10-character team ID
   ```
   Prefer this file over Xcode's Signing & Capabilities tab, which writes the team ID into the tracked project file.
4. **Create the App Store Connect record:** My Apps → New App → iOS, name, primary language, the bundle ID above, and an SKU.
5. **Sign in to Xcode** (Settings → Accounts) with the Apple ID that belongs to the team, or create an App Store Connect API key for command-line uploads.

## Upload a TestFlight build

Every upload needs a build number higher than the previous one for the same version.

### Option A: Xcode Organizer (simplest)

1. Select the `AI Petverse` scheme and **Any iOS Device (arm64)**.
2. Product → Archive.
3. In the Organizer, choose **Distribute App → App Store Connect → Upload**. Xcode can increment the build number for you.

### Option B: command line

```bash
xcodebuild archive \
  -project "AI Petverse.xcodeproj" \
  -scheme "AI Petverse" \
  -configuration Release \
  -destination 'generic/platform=iOS' \
  -archivePath build/AIPetverse.xcarchive \
  -allowProvisioningUpdates \
  CURRENT_PROJECT_VERSION=2

xcodebuild -exportArchive \
  -archivePath build/AIPetverse.xcarchive \
  -exportOptionsPlist Config/ExportOptions.plist \
  -exportPath build/export \
  -allowProvisioningUpdates
```

Without a signed-in Xcode account, add `-authenticationKeyPath`, `-authenticationKeyID` and `-authenticationKeyIssuerID` for an App Store Connect API key. Keep the `.p8` key outside the repository.

### After the upload

1. Wait for App Store Connect to finish processing (usually minutes; you get an email).
2. **Internal testing:** add up to 100 members of your App Store Connect team. No Beta App Review is needed.
3. **External testing** (up to 10,000 testers, public link): requires Beta App Review, test information, and a privacy policy URL.

## Before App Store submission

Track these as the product grows; several become mandatory once accounts, uploads, or other users' content exist.

- [ ] Privacy policy URL and support URL.
- [ ] App Privacy answers match the shipped build. The current local-only build collects no data; this changes when sign-in or cloud generation ships.
- [ ] `PrivacyInfo.xcprivacy` updated for any new required-reason API or collected data type, and third-party SDKs ship their own manifests.
- [ ] Sign in with Apple offered alongside any third-party login (Guideline 4.8).
- [ ] In-app account deletion that also removes server data (Guideline 5.1.1(v)).
- [ ] Explicit consent before sending photos or personal data to a third-party AI service (Guideline 5.1.2).
- [ ] Report, block, and filtering for content other users can see, plus a contact method (Guideline 1.2).
- [ ] Digital goods sold through In-App Purchase (Guideline 3.1.1).
- [ ] No third-party game names or artwork in the app or listing.
- [ ] Age rating questionnaire, screenshots for the required iPhone display size, and review notes with a demo account if sign-in is required.

## Evidence boundary

A local unsigned `xcodebuild archive` proves the bundle shape (icon, privacy manifest, versioning, dSYM). It does not prove signing, upload, processing, or TestFlight availability; record those separately, with dates, once they happen.
