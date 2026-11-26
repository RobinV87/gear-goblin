import 'fake-indexeddb/auto'
import { describe, it, expect } from 'vitest'
import { BrowserDeviceRepository } from '../src/services/deviceRepository'
const input = { manufacturer: 'Anbernic', model: 'RG35XX', nickname: '', variant: '', notes: '' }
describe('device repository', () => {
  it('creates, updates, lists and deletes devices', async () => {
    const repo = new BrowserDeviceRepository(crypto.randomUUID())
    const device = await repo.create(input)
    expect((await repo.list())[0]).toMatchObject(input)
    await repo.update(device.id, { ...input, nickname: 'Pocket' })
    expect((await repo.list())[0].nickname).toBe('Pocket')
    await repo.delete(device.id)
    expect(await repo.list()).toEqual([])
  })
  it('rejects invalid devices and updates to missing devices', async () => {
    const repo = new BrowserDeviceRepository(crypto.randomUUID())
    await expect(repo.create({ ...input, model: '  ' })).rejects.toThrow()
    await expect(repo.update('missing', input)).rejects.toThrow()
    expect(await repo.list()).toEqual([])
  })
})

it('preserves an optional purchase date when saving and updating a device', async () => {
  const repo = new BrowserDeviceRepository(crypto.randomUUID())
  const device = await repo.create({ ...input, purchaseDate: '2024-03-12' })
  expect((await repo.list())[0].purchaseDate).toBe('2024-03-12')
  await repo.update(device.id, { ...input, purchaseDate: '2024-04-01' })
  expect((await repo.list())[0].purchaseDate).toBe('2024-04-01')
})
