import Dexie, { type EntityTable } from 'dexie'
import { validateDevice, type Device, type DeviceInput } from '../features/devices/model'
import { type DeviceImage, validImage } from '../features/devices/image'
import { type WorkshopInput, type WorkshopRecord } from '../features/workshop/model'

export interface DeviceRepository {
  list(): Promise<Device[]>
  create(input: DeviceInput): Promise<Device>
  update(id: string, input: DeviceInput): Promise<void>
  delete(id: string): Promise<void>
  listRecords(deviceId?: string): Promise<WorkshopRecord[]>
  saveRecord(deviceId: string, input: WorkshopInput, id?: string): Promise<void>
  deleteRecord(id: string): Promise<void>
  snapshot(): Promise<CollectionSnapshot>
  restore(snapshot: CollectionSnapshot): Promise<void>
  setImage(deviceId: string, image: DeviceImage | null): Promise<void>
}
export interface CollectionSnapshot { devices: Device[]; records: WorkshopRecord[]; images: DeviceImage[] }
export class BrowserDeviceRepository implements DeviceRepository {
  private db: Dexie & { devices: EntityTable<Device, 'id'>; records: EntityTable<WorkshopRecord, 'id'>; images: EntityTable<DeviceImage, 'deviceId'> }
  constructor(name = 'gear-goblin') {
    this.db = new Dexie(name) as typeof this.db
    this.db.version(1).stores({ devices: 'id, manufacturer, model, createdAt' })
    this.db.version(2).stores({ devices: 'id, manufacturer, model, createdAt', records: 'id, deviceId, kind, [deviceId+kind]' })
    this.db.version(3).stores({ devices: 'id, manufacturer, model, createdAt', records: 'id, deviceId, kind, [deviceId+kind]', images: 'deviceId' })
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
    await this.db.transaction('rw', this.db.devices, this.db.records, this.db.images, async () => {
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
  async snapshot(): Promise<CollectionSnapshot> {
    return this.db.transaction('r', this.db.devices, this.db.records, this.db.images, async () => ({ devices: await this.db.devices.toArray(), records: await this.db.records.toArray(), images: await this.db.images.toArray() }))
  }
  async setImage(deviceId: string, image: DeviceImage | null) {
    if (image && (image.deviceId !== deviceId || !validImage(image.data, image.mime))) throw new Error('Invalid image.')
    await this.db.transaction('rw', this.db.devices, this.db.images, async () => {
      if (!await this.db.devices.get(deviceId)) throw new Error('Device no longer exists.')
      if (image) await this.db.images.put(image); else await this.db.images.delete(deviceId)
    })
  }
  async restore(snapshot: CollectionSnapshot) {
    await this.db.transaction('rw', this.db.devices, this.db.records, this.db.images, async () => {
      await this.db.images.clear(); await this.db.records.clear(); await this.db.devices.clear()
      await this.db.devices.bulkAdd(snapshot.devices); await this.db.records.bulkAdd(snapshot.records); await this.db.images.bulkAdd(snapshot.images)
    })
  }
}
export const deviceRepository: DeviceRepository = new BrowserDeviceRepository()
