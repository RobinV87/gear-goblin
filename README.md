# Gear Goblin

**Your handheld hoard, organized.** A free, offline-first digital garage for retro gaming handhelds. No account, advertisements, analytics, or online service.

## Milestone 1B

Open a handheld's device card to record firmware installations, storage configurations, accessories, and modifications. The Firmware and Storage tabs offer quick access by handheld. Profiles and workshop entries are stored locally in IndexedDB and can be lost if browser site data is cleared.

## Development

Requires Node.js 24 or newer and npm. Run `npm ci`, then `npm run dev`. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` for checks. The project uses React, TypeScript, Vite, Dexie/IndexedDB and Vitest.

## Android

Android packaging, native SQLite, file import/export and device testing are planned for milestone 1D (storage and backup groundwork in 1C). There is no Android build yet. The intended application ID is `app.geargoblin.mobile`; verify ownership and availability before publishing and update the Capacitor configuration and Android package at that time.

## Screenshots

Screenshots will be added after the interface is verified on Android.

## Privacy

Device data remains in local browser storage. The app has no dedicated fields for serial numbers or purchase details. Future backups will contain private data and must be handled accordingly.

## Roadmap

- 1C: versioned native database, complete validated backup and transactional restore.
- 1D: Android packaging, usability, documentation and release preparation.
- Later: model catalog, comparisons, QR labels, repair reminders, statistics, wishlist, optional donations and synchronization, desktop app, and advanced configuration management.

See [architecture](docs/ARCHITECTURE.md) and [contributing](CONTRIBUTING.md).
