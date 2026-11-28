import { useEffect, useState } from 'react'
import { liveQuery } from 'dexie'
import { deviceRepository } from '../../services/deviceRepository'
import type { Game } from '../games/model'
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

export function useGames() {
  const [games, setGames] = useState<Game[]>([])
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    const subscription = liveQuery(() => deviceRepository.listGames()).subscribe({
      next: setGames,
      error: () => setUnavailable(true),
    })
    return () => subscription.unsubscribe()
  }, [])

  const byDevice = new Map<string, Game[]>()
  for (const game of games) {
    for (const id of game.deviceIds) {
      const entries = byDevice.get(id) ?? []
      entries.push(game)
      byDevice.set(id, entries)
    }
  }
  return { byDevice, unavailable }
}

export function filterDevices(devices: Device[], records: WorkshopRecord[], search: string, manufacturer: string, firmware: string, gamesByDevice: Map<string, Game[]>) {
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
    if (terms.every(term => text.includes(term))) return true
    return (gamesByDevice.get(device.id) ?? []).some(game => {
      const gameText = normalizedSearch(`${game.title} ${game.system}`)
      return terms.every(term => text.includes(term) || gameText.includes(term))
    })
  })
}
