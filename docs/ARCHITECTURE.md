# Architecture

Milestone 1B is a browser application. React renders the interface; device validation and the repository contract are separate from presentation. The browser adapter uses Dexie over IndexedDB, with UUID keys and a versioned schema. Schema version 2 adds workshop records keyed by device ID. Deleting a device removes its workshop records in the same transaction. No network service is involved at runtime.

The future Android adapter must implement the same application-facing contract using native SQLite, with explicit migrations, transactions and tested import/export. Browser and native storage are separate physical databases: moving data between them needs a deliberate backup/migration workflow. Images require their own storage and lifecycle design. Browser storage can be evicted or cleared, and no backup exists yet.

Navigation currently uses local UI state. Native back handling, lifecycle, permissions, file access, accessibility refinement and device testing remain Android work. The UI uses a small token-like palette in CSS, with a light theme planned. No studio-wide framework is required; proven patterns or components can later be extracted into independent packages when another product actually needs them, without tying products to a monorepo or backend.
