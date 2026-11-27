# Gear Goblin

**Your handheld hoard, organized.** A free, offline-first digital garage for retro gaming handhelds. No account, advertisements, analytics, or online service.

## Milestone 1C (browser)

Open a handheld's device card to record firmware installations, storage configurations, accessories, and modifications. The Firmware and Storage tabs offer quick access by handheld. Profiles and workshop entries are stored locally in IndexedDB and can be lost if browser site data is cleared.

Add or replace a JPEG, PNG, or WebP photo from a handheld's card. In **Settings → Backup & restore**, export an unencrypted ZIP of your handhelds, workshop entries, and photos. Choose a backup to validate it and preview its contents before confirming a full replacement. Backups are limited to 50 MB and photos to 5 MB each.

## Development

Requires Node.js 24 or newer and npm. Run `npm ci`, then `npm run dev`. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` for checks. The project uses React, TypeScript, Vite, Dexie/IndexedDB and Vitest.

## Android

Android packaging, native SQLite, file import/export and device testing are planned for milestone 1D (storage and backup groundwork in 1C). There is no Android build yet. The intended application ID is `app.geargoblin.mobile`; verify ownership and availability before publishing and update the Capacitor configuration and Android package at that time.

## Screenshots

Screenshots will be added after the interface is verified on Android.

## Privacy

Device data remains in local browser storage. The app has no dedicated fields for serial numbers or purchase details. Exported backups contain your collection data and photos. Keep them in a private location.

## Roadmap

- 1C: versioned browser storage, validated backup and transactional restore are implemented. The native SQLite adapter remains pending.
- 1C follow-ups, in priority order:
  1. Handheld setup summary with the latest recorded successful firmware installation, storage slots and their purpose, and the last recorded change.
  2. Collection CSV export with one row per handheld, including the model, variant, firmware, and storage summary. ZIP remains the format for full backup and restore.
- 1D: Android packaging, usability, documentation and release preparation.
- Later: model catalog, comparisons, QR labels, repair reminders, statistics, wishlist, optional donations and synchronization, desktop app, and advanced configuration management.

See [architecture](docs/ARCHITECTURE.md) and [contributing](CONTRIBUTING.md).
