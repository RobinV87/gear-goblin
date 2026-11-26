# Gear Goblin

**Your handheld hoard, organized.** A free, offline-first digital garage for retro gaming handhelds. No account, advertisements, analytics, or online service.

## Current milestone

Create, edit, list and delete basic handheld profiles in a browser, with local IndexedDB storage. Collection and device views offer grid and list layouts. Track firmware installations, storage configurations, accessories and modifications for each device. Firmware and storage sections provide an index of your handhelds. Device photos can be added from a JPEG, PNG or WebP file (up to 5 MB). Settings offers Workshop, Workbench Light, Pocket Green and system-following themes, larger text and reduced motion. The grid/list choice is remembered. Versioned ZIP export and full replacement restore include photos, related records and preferences. Data is local to the browser profile and can be lost if site data is cleared; keep backups in a separate location.

## Development

Requires Node.js 24 or newer and npm. Run `npm ci`, then `npm run dev`. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` for checks. The project uses React, TypeScript, Vite, Dexie/IndexedDB and Vitest.

## Android

Android packaging, native SQLite, file import/export and device testing are planned for milestone 1D (storage and backup groundwork in 1C). There is no Android build yet. The intended application ID is `app.geargoblin.mobile`; verify ownership and availability before publishing and update the Capacitor configuration and Android package at that time.

## Screenshots

Screenshots will be added after the interface is verified on Android.

## Privacy

Device data remains in local browser storage. Purchase dates and other user-entered details remain local. Backups are unencrypted and contain your collection and photos; store them securely.

## Roadmap

- 1B: firmware history, storage, accessories and modifications (browser implementation).
- 1C: versioned browser database, validated backup and transactional restore; native SQLite remains to be implemented and verified.
- 1D: Android packaging, usability, documentation and release preparation.
- Later: model catalog, comparisons, QR labels, repair reminders, statistics, wishlist, optional donations and synchronization, desktop app, and advanced configuration management.

See [architecture](docs/ARCHITECTURE.md) and [contributing](CONTRIBUTING.md).
