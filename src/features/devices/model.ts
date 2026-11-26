export interface Device {
  id: string
  manufacturer: string
  model: string
  nickname: string
  variant: string
  notes: string
  purchaseDate?: string
  createdAt: string
  updatedAt: string
}
export type DeviceInput = Pick<Device, 'manufacturer' | 'model' | 'nickname' | 'variant' | 'notes' | 'purchaseDate'>
export function validateDevice(input: DeviceInput): string | null {
  if (!input.manufacturer.trim() || !input.model.trim()) return 'Manufacturer and model are required.'
  return null
}
