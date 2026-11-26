import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate'
import { BrowserDeviceRepository } from '../src/services/deviceRepository'
import { defaultSettings } from '../src/features/settings/model'
import { createBackup, readBackup } from '../src/features/backup/backup'

describe('appearance preferences', () => {
  it('persists preferences and includes them in backup and restore', async () => {
    const repo = new BrowserDeviceRepository(crypto.randomUUID())
    const settings = { theme: 'green' as const, largeText: true, reduceMotion: true, view: 'list' as const }
    await repo.saveSettings(settings)
    expect((await repo.snapshot()).settings).toEqual(settings)
    const backup = readBackup(createBackup(await repo.snapshot()))
    const restored = new BrowserDeviceRepository(crypto.randomUUID())
    await restored.restore(backup)
    expect((await restored.snapshot()).settings).toEqual(settings)
  })
  it('opens older backups with default preferences', async () => {
    const repo = new BrowserDeviceRepository(crypto.randomUUID())
    const files = unzipSync(createBackup(await repo.snapshot()))
    const manifest = JSON.parse(strFromU8(files['manifest.json']))
    manifest.version = 1; delete manifest.settings
    files['manifest.json'] = strToU8(JSON.stringify(manifest))
    expect(readBackup(zipSync(files, { level: 0 })).settings).toEqual(defaultSettings)
  })
  it('upgrades version 3 databases with default preferences', async () => {
    const name = crypto.randomUUID(), old = new Dexie(name)
    old.version(3).stores({ devices: 'id, manufacturer, model, createdAt', records: 'id, deviceId, kind, [deviceId+kind]', images: 'deviceId' })
    await old.open(); old.close()
    expect((await new BrowserDeviceRepository(name).snapshot()).settings).toEqual(defaultSettings)
  })
})
