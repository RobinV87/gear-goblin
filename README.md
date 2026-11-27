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

## Android

Android packaging, native SQLite, file import/export and device testing are planned for milestone 1D (storage and backup groundwork in 1C). There is no Android build yet. The intended application ID is `app.geargoblin.mobile`; verify ownership and availability before publishing and update the Capacitor configuration and Android package at that time.

## Screenshots

Screenshots will be added after the interface is verified on Android.

## Privacy

Device data remains in local browser storage. The app has no dedicated fields for serial numbers or purchase details. Exported backups contain your collection data and photos. Keep them in a private location.

## Roadmap

- 1C: versioned browser storage, validated backup and transactional restore are implemented. The native SQLite adapter remains pending.
- 1D: Android packaging, usability, documentation and release preparation.
- Later: model catalog, comparisons, QR labels, repair reminders, statistics, wishlist, optional donations and synchronization, desktop app, and advanced configuration management.

See [architecture](docs/ARCHITECTURE.md) and [contributing](CONTRIBUTING.md).
