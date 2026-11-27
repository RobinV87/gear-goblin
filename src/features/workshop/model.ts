export type RecordKind = 'firmware' | 'storage' | 'accessory' | 'modification' | 'maintenance'
export interface WorkshopRecord {
  id: string
  deviceId: string
  kind: RecordKind
  name: string
  version: string
  date: string
  previousFirmware: string
  succeeded: boolean
  capacity: string
  purpose: string
  notes: string
  followUpDate?: string
  createdAt: string
}
export type WorkshopInput = Omit<WorkshopRecord, 'id' | 'deviceId' | 'createdAt'>
export function newWorkshopInput(kind: RecordKind): WorkshopInput {
  return { kind, name: '', version: '', date: '', previousFirmware: '', succeeded: true, capacity: '', purpose: '', notes: '' }
}
