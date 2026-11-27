import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { describe, expect, it } from 'vitest'
import { BrowserDeviceRepository } from '../src/services/deviceRepository'
import { newWorkshopInput } from '../src/features/workshop/model'

const device = { manufacturer: 'Retroid', model: 'Pocket 5', nickname: '', variant: '', notes: '' }
describe('workshop records', () => {
  it('preserves version 1 devices when upgrading and manages related records', async () => {
    const name = crypto.randomUUID()
    const old = new Dexie(name)
    old.version(1).stores({ devices: 'id, manufacturer, model, createdAt' })
    await old.table('devices').add({ ...device, id: 'old-device', createdAt: '2024-01-01', updatedAt: '2024-01-01' })
    old.close()
    const repo = new BrowserDeviceRepository(name)
    expect((await repo.list())[0].id).toBe('old-device')
    await repo.saveRecord('old-device', { ...newWorkshopInput('firmware'), name: 'Rocknix', version: '1.0', date: '2025-01-01', previousFirmware: 'Stock', succeeded: true })
    await repo.saveRecord('old-device', { ...newWorkshopInput('firmware'), name: 'Test', date: '2025-02-01', succeeded: false })
    await repo.saveRecord('old-device', { ...newWorkshopInput('storage'), name: 'TF2', capacity: '128 GB', purpose: 'Library' })
    await repo.saveRecord('old-device', { ...newWorkshopInput('accessory'), name: 'Case' })
    await repo.saveRecord('old-device', { ...newWorkshopInput('modification'), name: 'Buttons' })
    const entries = await repo.listRecords('old-device')
    expect(entries).toHaveLength(5)
    expect(entries.filter(entry => entry.kind === 'firmware').map(entry => entry.name)).toEqual(['Test', 'Rocknix'])
    const storage = entries.find(entry => entry.kind === 'storage')!
    await repo.saveRecord('old-device', { ...storage, capacity: '256 GB' }, storage.id)
    expect((await repo.listRecords('old-device')).find(entry => entry.id === storage.id)?.capacity).toBe('256 GB')
    await repo.deleteRecord(storage.id)
    expect(await repo.listRecords('old-device')).toHaveLength(4)
    await repo.delete('old-device')
    expect(await repo.listRecords()).toEqual([])
  })
  it('rejects blank entries and records for deleted devices', async () => {
    const repo = new BrowserDeviceRepository(crypto.randomUUID())
    const created = await repo.create(device)
    await expect(repo.saveRecord(created.id, newWorkshopInput('storage'))).rejects.toThrow()
    await expect(repo.saveRecord('missing', { ...newWorkshopInput('accessory'), name: 'Case' })).rejects.toThrow()
    expect(await repo.listRecords()).toEqual([])
  })
})
