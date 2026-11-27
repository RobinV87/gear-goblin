import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { deviceRepository, type CollectionSnapshot } from '../../services/deviceRepository'
import { createBackup, maxArchive, readBackup } from './backup'

export function BackupSettings({ refresh }: { refresh: () => Promise<void> }) {
  const [pending, setPending] = useState<CollectionSnapshot | null>(null)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const picker = useRef<HTMLInputElement>(null)

  function start() {
    setBusy(true)
    setStatus('')
    setError('')
  }

  async function exportFile() {
    start()
    try {
      const bytes = createBackup(await deviceRepository.snapshot())
      const url = URL.createObjectURL(new Blob([new Uint8Array(bytes)], { type: 'application/zip' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `gear-goblin-${new Date().toISOString().slice(0, 10)}.zip`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
      setStatus('Backup ready to download.')
    } catch {
      setError('Could not create a backup. The ZIP limit is 50 MB.')
    } finally {
      setBusy(false)
    }
  }

  async function choose(file: File) {
    start()
    setPending(null)
    try {
      if (file.size > maxArchive) {
        setError('Choose a Gear Goblin backup ZIP up to 50 MB.')
        return
      }
      setPending(readBackup(new Uint8Array(await file.arrayBuffer())))
    } catch {
      setError('This backup is invalid, unsupported, or damaged. Your collection was not changed.')
    } finally {
      setBusy(false)
    }
  }

  async function restore() {
    if (!pending || !window.confirm('Replace your entire collection with this backup? Export your current collection first if you want to keep it.')) return
    start()
    try {
      await deviceRepository.restore(pending)
      await refresh()
      setPending(null)
      setStatus('Backup restored.')
    } catch {
      setError('Restore failed. Your current collection was not changed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="placeholder backup-panel">
      <h2>Backup &amp; restore</h2>
      <p>Save an unencrypted ZIP with your handhelds, workshop entries, and photos.</p>
      <div className="backup-actions">
        <button className="primary" disabled={busy} onClick={() => void exportFile()}><Download size={17} aria-hidden="true" /> Export collection</button>
        <button className="secondary" disabled={busy} onClick={() => picker.current?.click()}><Upload size={17} aria-hidden="true" /> Choose backup</button>
        <input ref={picker} type="file" aria-label="Backup ZIP" accept=".zip,application/zip" hidden onChange={event => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ''
          if (file) void choose(file)
        }} />
      </div>
      {pending && <div className="restore-preview">
        <h3>Ready to restore</h3>
        <p>Handhelds: {pending.devices.length} · Workshop entries: {pending.records.length} · Photos: {pending.images.length}</p>
        <p>Restoring replaces your entire current collection.</p>
        <div className="backup-actions">
          <button className="primary" disabled={busy} onClick={() => void restore()}>Replace collection</button>
          <button className="secondary" disabled={busy} onClick={() => setPending(null)}>Cancel</button>
        </div>
      </div>}
      {status && <p role="status">{status}</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  )
}
