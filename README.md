# Gear Goblin

**Your handheld hoard, organized.** A free, offline-first digital garage for retro gaming handhelds. No account, advertisements, analytics, or online service.

## Milestone 1A

Create, edit, list and delete basic handheld profiles in a browser, with local IndexedDB storage. Collection and device views offer grid and list layouts. Firmware, storage and settings navigation is in place; these sections describe planned work. Data is local to the browser profile and can be lost if site data is cleared. Backup is not implemented yet; do not use this milestone as the sole record of a collection.

## Development

Requires Node.js 24 or newer and npm. Run `npm ci`, then `npm run dev`. Run `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` for checks. The project uses React, TypeScript, Vite, Dexie/IndexedDB and Vitest.

## Android

Android packaging, native SQLite, file import/export and device testing are planned for milestone 1D (storage and backup groundwork in 1C). There is no Android build yet. The intended application ID is `app.geargoblin.mobile`; verify ownership and availability before publishing and update the Capacitor configuration and Android package at that time.

## Screenshots

Screenshots will be added after the interface is verified on Android.

## Privacy

Device data remains in local browser storage. No serial numbers or purchase details are collected in 1A. Future backups will contain private data and must be handled accordingly.

## Roadmap

- 1B: firmware history, storage, accessories and modifications.
- 1C: versioned native database, complete validated backup and transactional restore.
- 1D: Android packaging, usability, documentation and release preparation.
- Later: model catalog, comparisons, QR labels, repair reminders, statistics, wishlist, optional donations and synchronization, desktop app, and advanced configuration management.

See [architecture](docs/ARCHITECTURE.md) and [contributing](CONTRIBUTING.md).
