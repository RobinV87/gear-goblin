import Dexie, { type EntityTable } from 'dexie'
import { validateDevice, type Device, type DeviceInput } from '../features/devices/model'
import { type WorkshopInput, type WorkshopRecord } from '../features/workshop/model'

export interface DeviceRepository {
  list(): Promise<Device[]>
  create(input: DeviceInput): Promise<Device>
  update(id: string, input: DeviceInput): Promise<void>
  delete(id: string): Promise<void>
  listRecords(deviceId?: string): Promise<WorkshopRecord[]>
  saveRecord(deviceId: string, input: WorkshopInput, id?: string): Promise<void>
  deleteRecord(id: string): Promise<void>
}
export class BrowserDeviceRepository implements DeviceRepository {
  private db: Dexie & { devices: EntityTable<Device, 'id'>; records: EntityTable<WorkshopRecord, 'id'> }
  constructor(name = 'gear-goblin') {
    this.db = new Dexie(name) as typeof this.db
    this.db.version(1).stores({ devices: 'id, manufacturer, model, createdAt' })
    this.db.version(2).stores({ devices: 'id, manufacturer, model, createdAt', records: 'id, deviceId, kind, [deviceId+kind]' })
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
    await this.db.transaction('rw', this.db.devices, this.db.records, async () => {
      await this.db.records.where('deviceId').equals(id).delete()
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
}
export const deviceRepository: DeviceRepository = new BrowserDeviceRepository()
