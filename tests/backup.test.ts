import 'fake-indexeddb/auto'
import { zipSync, strToU8, unzipSync, strFromU8 } from 'fflate'
import { describe, expect, it } from 'vitest'
import { BrowserDeviceRepository } from '../src/services/deviceRepository'
import { newWorkshopInput } from '../src/features/workshop/model'
import { createBackup, readBackup } from '../src/features/backup/backup'

const input = { manufacturer: 'Anbernic', model: 'RG35XX', nickname: '', variant: '', notes: '' }
const png = new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0])
describe('collection backup', () => {
  it('round-trips multiple devices, photos and related records', async () => {
    const original = new BrowserDeviceRepository(crypto.randomUUID())
    const first = await original.create(input), second = await original.create({ ...input, model: 'RG DS Plus' })
    for (const d of [first, second]) {
      await original.setImage(d.id, { deviceId: d.id, mime: 'image/png', data: png })
      await original.saveRecord(d.id, { ...newWorkshopInput('firmware'), name: 'Stock', version: '1', succeeded: true })
      await original.saveRecord(d.id, { ...newWorkshopInput('storage'), name: 'TF2', capacity: '128 GB' })
      await original.saveRecord(d.id, { ...newWorkshopInput('accessory'), name: 'Case' })
      await original.saveRecord(d.id, { ...newWorkshopInput('modification'), name: 'Buttons' })
    }
    const snapshot = await original.snapshot()
    const restored = readBackup(createBackup(snapshot))
    expect(restored).toEqual(snapshot)
    const target = new BrowserDeviceRepository(crypto.randomUUID())
    await target.create({ ...input, model: 'Old' })
    await target.restore(restored)
    expect(await target.snapshot()).toEqual(snapshot)
  })
  it('rejects corrupt, unsafe, unsupported and duplicate backups without changing existing data', async () => {
    const repo = new BrowserDeviceRepository(crypto.randomUUID()); await repo.create(input)
    const before = await repo.snapshot(), valid = createBackup(before)
    const corrupted = valid.slice(); corrupted[40] ^= 1
    expect(() => readBackup(corrupted)).toThrow()
    expect(() => readBackup(zipSync({ '../evil': strToU8('oops'), 'manifest.json': strToU8('{}') }, { level: 0 }))).toThrow()
    const files = unzipSync(valid); const manifest = JSON.parse(strFromU8(files['manifest.json']))
    manifest.devices.push(manifest.devices[0])
    files['manifest.json'] = strToU8(JSON.stringify(manifest))
    expect(() => readBackup(zipSync(files, { level: 0 }))).toThrow()
    manifest.version = 99; files['manifest.json'] = strToU8(JSON.stringify(manifest))
    expect(() => readBackup(zipSync(files, { level: 0 }))).toThrow()
    expect(await repo.snapshot()).toEqual(before)
  })
  it('rolls back a failed restore transaction', async () => {
    const repo = new BrowserDeviceRepository(crypto.randomUUID()); await repo.create(input)
    const before = await repo.snapshot()
    await expect(repo.restore({ ...before, devices: [before.devices[0], before.devices[0]] })).rejects.toThrow()
    expect(await repo.snapshot()).toEqual(before)
  })
})

it('upgrades an existing version 2 collection without losing device records', async () => {
  const { default: Dexie } = await import('dexie')
  const name = crypto.randomUUID(), id = crypto.randomUUID(), old = new Dexie(name)
  old.version(1).stores({ devices: 'id, manufacturer, model, createdAt' })
  old.version(2).stores({ devices: 'id, manufacturer, model, createdAt', records: 'id, deviceId, kind, [deviceId+kind]' })
  await old.table('devices').add({ ...input, id, createdAt: '2025-01-01T00:00:00.000Z', updatedAt: '2025-01-01T00:00:00.000Z' })
  await old.table('records').add({
    ...newWorkshopInput('accessory'), id: crypto.randomUUID(), deviceId: id,
    name: 'Case', createdAt: '2025-01-01T00:00:00.000Z',
  })
  old.close()
  const repo = new BrowserDeviceRepository(name)
  expect((await repo.list())[0].id).toBe(id)
  expect((await repo.listRecords(id)).map(record => record.name)).toEqual(['Case'])
  expect((await repo.snapshot()).images).toEqual([])
})
