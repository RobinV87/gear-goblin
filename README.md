# Gear Goblin

**Your handheld hoard, organized.** A free, offline-first digital garage for retro gaming handhelds. No account, advertisements, analytics, or online service.

## Milestone 1C (browser)

Open a handheld's device card to record firmware installations, storage configurations, accessories, and modifications. The Firmware and Storage tabs offer quick access by handheld. Profiles and workshop entries are stored locally in IndexedDB and can be lost if browser site data is cleared.

Add or replace a JPEG, PNG, or WebP photo from a handheld's card. In **Settings → Backup & restore**, export an unencrypted ZIP of your handhelds, workshop entries, and photos. Choose a backup to validate it and preview its contents before confirming a full replacement. Backups are limited to 50 MB and photos to 5 MB each.

## Development

Requires Node.js 24 or newer and npm. Run `npm ci`, then `npm run dev`. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` for checks. The project uses React, TypeScript, Vite, Dexie/IndexedDB and Vitest.

## Optional Google Drive export

Enable the Google Drive API in a Google Cloud project and configure its OAuth consent screen. Create a **Web application** OAuth client with `https://robinv87.github.io` as an authorized JavaScript origin. For local development, add the exact localhost origin used by Vite. Use a test account while the OAuth app is in testing.

Set the GitHub Actions repository variable `GOOGLE_DRIVE_CLIENT_ID` to the public OAuth client ID, then rerun the Pages deployment. For local builds, set `VITE_GOOGLE_DRIVE_CLIENT_ID` in the environment. Both accept the client ID only.

When configured, **Settings → Backup & restore → Choose where to save → Save to Google Drive** sends the selected backup ZIP to My Drive after Google authorization. It requests the per-file `drive.file` scope and uses the access token for that export only. Download and system sharing remain available. To restore from Drive, choose the ZIP from your device's file picker or download it first.

## Android sideload preview

Open the **Build Android APK** workflow run and download the **Gear-Goblin-Android** artifact. Unzip it, transfer `Gear-Goblin-Android.apk` to your phone, and open it. Android may ask you to allow installs from the app that opened the APK. This is a debug-signed preview. Export a backup before switching between CI-built APKs because their signing keys may differ.

The Android app bundles the website and can open without internet access. Its WebView has a separate local collection. Move an existing browser collection with **Settings → Backup & restore**. On Android, **Export collection** opens the system file picker to save the ZIP.

Build locally with JDK 21 and Android SDK 35. Run `npm ci`, `npm run android:sync`, then `cd android && ./gradlew assembleDebug`. The APK is generated at `android/app/build/outputs/apk/debug/app-debug.apk`. The application ID is `app.geargoblin.mobile`.

**Settings → Android updates → Check for updates** looks for public Android prereleases. **Download & install** downloads the APK and opens Android's installer for confirmation. Android may ask you to allow installs from Gear Goblin the first time.

To publish, run **Build Android APK** on `main` with **Publish a public Android prerelease** checked. The workflow requires the repository's `ANDROID_TEST_KEYSTORE_BASE64` secret. Use the same dedicated debug keystore for every release, with alias `androiddebugkey` and keystore/key password `android`. Keep a private copy of the keystore. The workflow uses its run number plus one as the APK version code.

To switch from a preview signed by a different key, export a ZIP backup first. Uninstall the old preview, install the first public prerelease APK directly from GitHub, then restore your ZIP. Updates signed with the same key can install over that build.

## Screenshots

Screenshots will be added after the interface is verified on Android.

## Privacy

Device data remains in local browser storage. The app has no dedicated fields for serial numbers or purchase details. Exported backups contain your collection data and photos. Keep them in a private location.

## Roadmap

- 1C: versioned browser storage, validated backup and transactional restore are implemented. The native SQLite adapter remains pending.
- 1D: Android packaging, usability, documentation and release preparation.
- Later: model catalog, comparisons, QR labels, repair reminders, statistics, wishlist, optional donations and synchronization, desktop app, and advanced configuration management.

See [architecture](docs/ARCHITECTURE.md) and [contributing](CONTRIBUTING.md).
