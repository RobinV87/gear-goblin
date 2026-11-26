import Dexie, { type EntityTable } from 'dexie'
import { validateDevice, type Device, type DeviceInput } from '../features/devices/model'

export interface DeviceRepository {
  list(): Promise<Device[]>
  create(input: DeviceInput): Promise<Device>
  update(id: string, input: DeviceInput): Promise<void>
  delete(id: string): Promise<void>
}
export class BrowserDeviceRepository implements DeviceRepository {
  private db: Dexie & { devices: EntityTable<Device, 'id'> }
  constructor(name = 'gear-goblin') {
    this.db = new Dexie(name) as Dexie & { devices: EntityTable<Device, 'id'> }
    this.db.version(1).stores({ devices: 'id, manufacturer, model, createdAt' })
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
  async delete(id: string) { await this.db.devices.delete(id) }
}
export const deviceRepository: DeviceRepository = new BrowserDeviceRepository()
