import Dexie, { type EntityTable } from 'dexie'
import { validateDevice, type Device, type DeviceInput } from '../features/devices/model'
import { type DeviceImage, validImage } from '../features/devices/image'
import { gameIdentity, type Game, type GameInput } from '../features/games/model'
import { type WorkshopInput, type WorkshopRecord } from '../features/workshop/model'

export interface DeviceRepository {
  list(): Promise<Device[]>
  create(input: DeviceInput): Promise<Device>
  update(id: string, input: DeviceInput): Promise<void>
  delete(id: string): Promise<void>
  listRecords(deviceId?: string): Promise<WorkshopRecord[]>
  saveRecord(deviceId: string, input: WorkshopInput, id?: string): Promise<void>
  deleteRecord(id: string): Promise<void>
  copySetup(sourceId: string, targetId: string): Promise<void>
  listGames(): Promise<Game[]>
  saveGame(input: GameInput, id?: string): Promise<void>
  deleteGame(id: string): Promise<void>
  snapshot(): Promise<CollectionSnapshot>
  restore(snapshot: CollectionSnapshot): Promise<void>
  getImage(deviceId: string): Promise<DeviceImage | undefined>
  setImage(deviceId: string, image: DeviceImage | null): Promise<void>
}
export interface CollectionSnapshot { devices: Device[]; records: WorkshopRecord[]; images: DeviceImage[]; games: Game[] }
export class BrowserDeviceRepository implements DeviceRepository {
  private db: Dexie & { devices: EntityTable<Device, 'id'>; records: EntityTable<WorkshopRecord, 'id'>; images: EntityTable<DeviceImage, 'deviceId'>; games: EntityTable<Game, 'id'> }
  constructor(name = 'gear-goblin') {
    this.db = new Dexie(name) as typeof this.db
    this.db.version(1).stores({ devices: 'id, manufacturer, model, createdAt' })
    this.db.version(2).stores({ devices: 'id, manufacturer, model, createdAt', records: 'id, deviceId, kind, [deviceId+kind]' })
    this.db.version(3).stores({ devices: 'id, manufacturer, model, createdAt', records: 'id, deviceId, kind, [deviceId+kind]', images: 'deviceId' })
    this.db.version(4).stores({ games: 'id, *deviceIds' })
  }
  async list() { return this.db.devices.orderBy('createdAt').reverse().toArray() }
  async create(input: DeviceInput) {
    const error = validateDevice(input); if (error) throw new Error(error)
    const now = new Date().toISOString()
    const device = { ...input, manufacturer: input.manufacturer.trim(), model: input.model.trim(), id: crypto.randomUUID(), createdAt: now, updatedAt: now }
    await this.db.devices.add(device); return device
  }
  async update(id: string, input: DeviceInput) {
    const error = validateDevice(input); if (error) throw new Error(error)
    const count = await this.db.devices.update(id, { ...input, manufacturer: input.manufacturer.trim(), model: input.model.trim(), updatedAt: new Date().toISOString() })
    if (!count) throw new Error('Device no longer exists.')
  }
  async delete(id: string) {
    await this.db.transaction('rw', this.db.devices, this.db.records, this.db.images, this.db.games, async () => {
      for (const game of await this.db.games.where('deviceIds').equals(id).toArray()) {
        const deviceIds = game.deviceIds.filter(deviceId => deviceId !== id)
        if (deviceIds.length) await this.db.games.update(game.id, { deviceIds })
        else await this.db.games.delete(game.id)
      }
      await this.db.records.where('deviceId').equals(id).delete()
      await this.db.images.delete(id)
      await this.db.devices.delete(id)
    })
  }
  async listRecords(deviceId?: string) {
    const records = deviceId ? await this.db.records.where('deviceId').equals(deviceId).toArray() : await this.db.records.toArray()
    return records.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  }
  async saveRecord(deviceId: string, input: WorkshopInput, id?: string) {
    if (!input.name.trim()) throw new Error('Name is required.')
    await this.db.transaction('rw', this.db.devices, this.db.records, async () => {
      if (!await this.db.devices.get(deviceId)) throw new Error('Device no longer exists.')
      if (id) {
        const existing = await this.db.records.get(id)
        if (!existing || existing.deviceId !== deviceId || existing.kind !== input.kind) throw new Error('Record no longer exists.')
        await this.db.records.put({ ...existing, ...input, name: input.name.trim() })
      } else await this.db.records.add({ ...input, name: input.name.trim(), deviceId, id: crypto.randomUUID(), createdAt: new Date().toISOString() })
    })
  }
  async deleteRecord(id: string) { await this.db.records.delete(id) }
  async copySetup(sourceId: string, targetId: string) {
    if (sourceId === targetId) throw new Error('Choose a different handheld.')
    await this.db.transaction('rw', this.db.devices, this.db.records, async () => {
      const [source, target] = await this.db.devices.bulkGet([sourceId, targetId])
      if (!source || !target) throw new Error('Handheld no longer exists.')

      const [sourceRecords, targetRecords] = await Promise.all([
        this.db.records.where('deviceId').equals(sourceId).toArray(),
        this.db.records.where('deviceId').equals(targetId).toArray(),
      ])
      const recordKey = (record: WorkshopRecord) => `${record.kind}:${record.name.trim().toLowerCase()}`
      const existing = new Set(targetRecords.map(recordKey))
      const now = new Date().toISOString()
      const additions: WorkshopRecord[] = []
      for (const record of sourceRecords) {
        if (record.kind !== 'storage' && record.kind !== 'accessory') continue
        const key = recordKey(record)
        if (existing.has(key)) continue
        additions.push({ ...record, id: crypto.randomUUID(), deviceId: targetId, createdAt: now })
        existing.add(key)
      }

      const notes = source.notes.trim()
      const currentNotes = target.notes.trim()
      const blocks = currentNotes.split(/\n{2,}/)
      const alreadyCopied = `\n\n${blocks.join('\n\n')}\n\n`.includes(`\n\n${notes.replace(/\n{2,}/g, '\n\n')}\n\n`)
      const nextNotes = notes && !alreadyCopied ? [target.notes.trimEnd(), notes].filter(Boolean).join('\n\n') : target.notes
      if (nextNotes.length > 5000) throw new Error('The combined notes exceed 5,000 characters.')
      if (additions.length) await this.db.records.bulkAdd(additions)
      if (additions.length || nextNotes !== target.notes) {
        await this.db.devices.update(targetId, { notes: nextNotes, updatedAt: now })
      }
    })
  }
  async listGames() {
    return this.db.games.toArray()
  }

  async saveGame(input: GameInput, id?: string) {
    const title = input.title.trim()
    const system = input.system.trim()
    const deviceIds = [...new Set(input.deviceIds)]
    if (!title || !system || title.length > 160 || system.length > 120 || !deviceIds.length) {
      throw new Error('Enter a title and system, and choose at least one handheld.')
    }

    await this.db.transaction('rw', this.db.devices, this.db.games, async () => {
      const devices = await this.db.devices.bulkGet(deviceIds)
      if (devices.some(device => !device)) throw new Error('A selected handheld no longer exists.')
      if (id && !(await this.db.games.get(id))) throw new Error('This game no longer exists.')

      const identity = gameIdentity(title, system)
      const duplicate = await this.db.games.filter(game => gameIdentity(game.title, game.system) === identity && game.id !== id).first()
      if (duplicate) {
        if (id) throw new Error('A game with this title and system already exists.')
        await this.db.games.update(duplicate.id, {
          deviceIds: [...new Set([...duplicate.deviceIds, ...deviceIds])],
        })
      } else {
        await this.db.games.put({ id: id ?? crypto.randomUUID(), title, system, deviceIds })
      }
    })
  }

  async deleteGame(id: string) { await this.db.games.delete(id) }

  async snapshot(): Promise<CollectionSnapshot> {
    return this.db.transaction('r', this.db.devices, this.db.records, this.db.images, this.db.games, async () => ({
      devices: await this.db.devices.toArray(),
      records: await this.db.records.toArray(),
      images: await this.db.images.toArray(),
      games: await this.db.games.toArray(),
    }))
  }
  async getImage(deviceId: string) { return this.db.images.get(deviceId) }
  async setImage(deviceId: string, image: DeviceImage | null) {
    if (image && (image.deviceId !== deviceId || !validImage(image.data, image.mime))) throw new Error('Invalid image.')
    await this.db.transaction('rw', this.db.devices, this.db.images, async () => {
      if (!await this.db.devices.get(deviceId)) throw new Error('Device no longer exists.')
      if (image) await this.db.images.put(image); else await this.db.images.delete(deviceId)
    })
  }
  async restore(snapshot: CollectionSnapshot) {
    await this.db.transaction('rw', this.db.devices, this.db.records, this.db.images, this.db.games, async () => {
      await this.db.games.clear()
      await this.db.images.clear(); await this.db.records.clear(); await this.db.devices.clear()
      await this.db.devices.bulkAdd(snapshot.devices); await this.db.records.bulkAdd(snapshot.records); await this.db.images.bulkAdd(snapshot.images)
      await this.db.games.bulkAdd(snapshot.games)
    })
  }
}
export const deviceRepository: DeviceRepository = new BrowserDeviceRepository()
