import { strFromU8, strToU8, zipSync, unzipSync } from 'fflate'
import { z } from 'zod'
import { defaultSettings, settingsSchema } from '../settings/model'
import { validImage, type DeviceImage } from '../devices/image'
import type { CollectionSnapshot } from '../../services/deviceRepository'

const maxArchive = 50 * 1024 * 1024
const uuid = z.string().uuid()
const text = z.string().max(5000)
const timestamp = z.iso.datetime({ offset: true })
const calendarDate = z.union([z.literal(''), z.iso.date()])
const device = z.object({ id: uuid, manufacturer: text.refine(value => value.trim().length > 0), model: text.refine(value => value.trim().length > 0), nickname: text, variant: text, notes: text, purchaseDate: calendarDate.optional(), createdAt: timestamp, updatedAt: timestamp }).strict()
const record = z.object({ id: uuid, deviceId: uuid, kind: z.enum(['firmware','storage','accessory','modification']), name: text.refine(value => value.trim().length > 0), version: text, date: calendarDate, previousFirmware: text, succeeded: z.boolean(), capacity: text, purpose: text, notes: text, createdAt: timestamp }).strict()
const image = z.object({ deviceId: uuid, mime: z.enum(['image/jpeg','image/png','image/webp']), path: z.string().max(100) }).strict()
const manifestFields = { format: z.literal('gear-goblin-backup'), exportedAt: timestamp, devices: z.array(device).max(10000), records: z.array(record).max(100000), images: z.array(image).max(10000) }
const manifest = z.discriminatedUnion('version', [z.object({ ...manifestFields, version: z.literal(1) }).strict(), z.object({ ...manifestFields, version: z.literal(2), settings: settingsSchema }).strict()])

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of bytes) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)) }
  return (crc ^ 0xffffffff) >>> 0
}

// Only uncompressed ZIPs produced by this application are accepted. Bound both
// archive and declared sizes before extraction, and reject paths and duplicates.
function inspectZip(data: Uint8Array) {
  if (data.length > maxArchive || data.length < 22) throw new Error('Backup is too large or invalid.')
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength)
  const end = data.length - 22
  if (view.getUint32(end, true) !== 0x06054b50 || view.getUint16(end + 20, true) !== 0 || view.getUint16(end + 4, true) !== 0 || view.getUint16(end + 6, true) !== 0) throw new Error('Unsupported ZIP archive.')
  const count = view.getUint16(end + 10, true), size = view.getUint32(end + 12, true), offset = view.getUint32(end + 16, true)
  if (view.getUint16(end + 8, true) !== count || count > 10001 || offset + size !== end) throw new Error('Invalid ZIP directory.')
  let pos = offset, total = 0
  const names = new Set<string>()
  for (let i = 0; i < count; i++) {
    if (pos + 46 > end || view.getUint32(pos, true) !== 0x02014b50) throw new Error('Invalid ZIP entry.')
    const flags = view.getUint16(pos + 8, true), method = view.getUint16(pos + 10, true), compressed = view.getUint32(pos + 20, true), plain = view.getUint32(pos + 24, true), nameLength = view.getUint16(pos + 28, true), extra = view.getUint16(pos + 30, true), comment = view.getUint16(pos + 32, true), local = view.getUint32(pos + 42, true)
    if (flags & 9 || method !== 0 || compressed !== plain || pos + 46 + nameLength + extra + comment > end || local + 30 > offset || view.getUint32(local, true) !== 0x04034b50) throw new Error('Unsupported ZIP entry.')
    const name = strFromU8(data.subarray(pos + 46, pos + 46 + nameLength))
    if (!(name === 'manifest.json' || /^images\/[0-9a-f-]{36}\.(jpg|png|webp)$/.test(name)) || names.has(name)) throw new Error('Unsafe or duplicate archive path.')
    const localNameLength = view.getUint16(local + 26, true), localExtra = view.getUint16(local + 28, true)
    if (view.getUint16(local + 6, true) !== flags || view.getUint16(local + 8, true) !== method || view.getUint32(local + 18, true) !== compressed || view.getUint32(local + 22, true) !== plain || strFromU8(data.subarray(local + 30, local + 30 + localNameLength)) !== name || local + 30 + localNameLength + localExtra + plain > offset) throw new Error('Invalid ZIP entry header.')
    const dataStart = local + 30 + localNameLength + localExtra
    if (view.getUint32(local + 14, true) !== view.getUint32(pos + 16, true) || crc32(data.subarray(dataStart, dataStart + plain)) !== view.getUint32(pos + 16, true)) throw new Error('Damaged ZIP entry.')
    total += plain; if (total > maxArchive || (name === 'manifest.json' && plain > 10 * 1024 * 1024) || (name !== 'manifest.json' && plain > 5 * 1024 * 1024)) throw new Error('Backup contents exceed size limits.')
    names.add(name); pos += 46 + nameLength + extra + comment
  }
  if (pos !== end || !names.has('manifest.json')) throw new Error('Invalid ZIP directory.')
  return names
}
export function createBackup(snapshot: CollectionSnapshot): Uint8Array {
  const files: Record<string, Uint8Array> = {}
  const images = snapshot.images.map(item => {
    if (!validImage(item.data, item.mime)) throw new Error('A stored image is invalid.')
    const ext = item.mime === 'image/jpeg' ? 'jpg' : item.mime === 'image/png' ? 'png' : 'webp'
    const path = `images/${item.deviceId}.${ext}`; files[path] = item.data
    return { deviceId: item.deviceId, mime: item.mime, path }
  })
  const payload = manifest.parse({ format: 'gear-goblin-backup', version: 2, exportedAt: new Date().toISOString(), devices: snapshot.devices, records: snapshot.records, images, settings: snapshot.settings })
  files['manifest.json'] = strToU8(JSON.stringify(payload))
  const result = zipSync(files, { level: 0 }); if (result.length > maxArchive) throw new Error('Collection exceeds the 50 MB backup limit.')
  return result
}
export function readBackup(data: Uint8Array): CollectionSnapshot {
  try {
    const paths = inspectZip(data), files = unzipSync(data)
    const parsed = manifest.parse(JSON.parse(strFromU8(files['manifest.json'])))
    const ids = new Set(parsed.devices.map(d => d.id)), recordIds = new Set(parsed.records.map(r => r.id)), imageIds = new Set(parsed.images.map(i => i.deviceId))
    if (ids.size !== parsed.devices.length || recordIds.size !== parsed.records.length || imageIds.size !== parsed.images.length || parsed.records.some(r => !ids.has(r.deviceId)) || parsed.images.some(i => !ids.has(i.deviceId))) throw new Error('Duplicate or orphaned records.')
    const expected = new Set(['manifest.json', ...parsed.images.map(i => i.path)])
    if (expected.size !== paths.size || [...paths].some(path => !expected.has(path))) throw new Error('Unexpected archive contents.')
    const images: DeviceImage[] = parsed.images.map(i => {
      const ext = i.mime === 'image/jpeg' ? 'jpg' : i.mime === 'image/png' ? 'png' : 'webp'
      if (i.path !== `images/${i.deviceId}.${ext}` || !files[i.path] || !validImage(files[i.path], i.mime)) throw new Error('Invalid image.')
      return { deviceId: i.deviceId, mime: i.mime, data: files[i.path] }
    })
    return { devices: parsed.devices, records: parsed.records, images, settings: parsed.version === 2 ? parsed.settings : { ...defaultSettings } }
  } catch { throw new Error('This backup is invalid, unsupported, or damaged. Your collection was not changed.') }
}
