import { useRef, useState } from 'react'
import { deviceRepository, type CollectionSnapshot } from '../../services/deviceRepository'
import { createBackup, readBackup } from './backup'

export function BackupSettings({ refresh }: { refresh: () => Promise<void> }) {
  const [pending, setPending] = useState<CollectionSnapshot | null>(null)
  const [message, setMessage] = useState('')
  const [duplicates, setDuplicates] = useState({ devices: 0, records: 0 })
  const [busy, setBusy] = useState(false)
  const picker = useRef<HTMLInputElement>(null)
  async function exportFile() {
    setBusy(true); setMessage('')
    try {
      const bytes = createBackup(await deviceRepository.snapshot())
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/zip' }))
      const link = document.createElement('a'); link.href = url; link.download = `gear-goblin-${new Date().toISOString().slice(0, 10)}.zip`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 60000)
      setMessage('Backup prepared. Keep it somewhere safe.')
    } catch { setMessage('Could not create a backup. Check your collection and available space.') } finally { setBusy(false) }
  }
  async function choose(file?: File) {
    setPending(null); setMessage(''); if (!file) return
    try { if (file.size > 50 * 1024 * 1024) throw new Error(); const backup = readBackup(new Uint8Array(await file.arrayBuffer())); const current = await deviceRepository.snapshot(); const deviceIds = new Set(current.devices.map(item => item.id)); const recordIds = new Set(current.records.map(item => item.id)); setDuplicates({ devices: backup.devices.filter(item => deviceIds.has(item.id)).length, records: backup.records.filter(item => recordIds.has(item.id)).length }); setPending(backup) }
    catch { setMessage('This backup is invalid, unsupported, or damaged. Your collection was not changed.') }
    if (picker.current) picker.current.value = ''
  }
  async function restore() {
    if (!pending || !window.confirm('Replace your entire current collection with this backup? This cannot be undone. Export your current collection first if you want to keep it.')) return
    setBusy(true); setMessage('')
    try { await deviceRepository.restore(pending); await refresh(); setPending(null); setMessage('Backup restored successfully.') }
    catch { setMessage('Restore failed. The existing collection was not changed.') } finally { setBusy(false) }
  }
  return <section className="backup-panel"><span className="micro">YOUR DATA</span><h2>Backup &amp; restore</h2><p>Save a copy of your collection, including device photos. Backups are stored wherever you choose and are not encrypted.</p><div className="backup-actions"><button className="button button-primary" disabled={busy} onClick={() => void exportFile()}>Export collection</button><button className="button button-quiet" disabled={busy} onClick={() => picker.current?.click()}>Choose backup</button><input ref={picker} type="file" accept=".zip,application/zip" hidden onChange={e => void choose(e.target.files?.[0])}/></div>{pending && <div className="restore-preview"><strong>Ready to restore</strong><p>{pending.devices.length} handhelds · {pending.records.length} related entries · {pending.images.length} photos</p><p>{duplicates.devices} matching handheld IDs and {duplicates.records} matching entry IDs found. Restoring replaces the entire current collection, including items not in the backup.</p><button className="button button-primary" disabled={busy} onClick={() => void restore()}>Replace collection</button> <button className="button button-quiet" disabled={busy} onClick={() => setPending(null)}>Cancel</button></div>}{message && <p role="status">{message}</p>}</section>
}
