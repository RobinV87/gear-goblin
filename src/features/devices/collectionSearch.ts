import { useEffect, useState } from 'react'
import { liveQuery } from 'dexie'
import { deviceRepository } from '../../services/deviceRepository'
import type { WorkshopRecord } from '../workshop/model'
import type { Device } from './model'

export const normalizedSearch = (text: string) => text.trim().toLowerCase()

export function useFirmwareRecords() {
  const [records, setRecords] = useState<WorkshopRecord[]>([])
  const [unavailable, setUnavailable] = useState(false)
  useEffect(() => {
    const subscription = liveQuery(() => deviceRepository.listRecords()).subscribe({
      next: entries => setRecords(entries.filter(entry => entry.kind === 'firmware')),
      error: () => setUnavailable(true),
    })
    return () => subscription.unsubscribe()
  }, [])
  return { records, unavailable }
}

export function filterDevices(devices: Device[], records: WorkshopRecord[], search: string, manufacturer: string, firmware: string) {
  const terms = normalizedSearch(search).split(/\s+/).filter(Boolean)
  const firmwareByDevice = new Map<string, WorkshopRecord[]>()
  for (const entry of records) {
    const entries = firmwareByDevice.get(entry.deviceId) ?? []
    entries.push(entry)
    firmwareByDevice.set(entry.deviceId, entries)
  }

  return devices.filter(device => {
    if (manufacturer && normalizedSearch(device.manufacturer) !== manufacturer) return false
    const entries = firmwareByDevice.get(device.id) ?? []
    if (firmware && !entries.some(entry => normalizedSearch(entry.name) === firmware)) return false
    const text = normalizedSearch([
      device.manufacturer, device.model, device.nickname,
      ...entries.map(entry => `${entry.name} ${entry.version}`),
    ].join(' '))
    return terms.every(term => text.includes(term))
  })
}
