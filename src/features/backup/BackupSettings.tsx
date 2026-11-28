import { useRef, useState } from 'react'
import { CloudUpload, Download, FolderOpen, Share2, Upload } from 'lucide-react'
import { deviceRepository, type CollectionSnapshot } from '../../services/deviceRepository'
import { isAndroidApp, saveAndroidBackup } from './androidBackup'
import { createBackup, maxArchive, readBackup } from './backup'
import { driveClientId, loadDriveAuthorization, requestDriveToken, uploadDriveBackup } from './googleDrive'

interface SavePickerWindow extends Window {
  showSaveFilePicker?: (options: {
    suggestedName: string
    types: { description: string; accept: Record<string, string[]> }[]
  }) => Promise<FileSystemFileHandle>
}

export function BackupSettings({ refresh }: { refresh: () => Promise<void> }) {
  const [drive, setDrive] = useState<Awaited<ReturnType<typeof loadDriveAuthorization>>>()
  const [prepared, setPrepared] = useState<File | null>(null)
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

  const savePicker = isAndroidApp ? undefined : (window as SavePickerWindow).showSaveFilePicker
  const canShareFiles = !isAndroidApp && typeof navigator.share === 'function' && typeof navigator.canShare === 'function'

  function download(file: File) {
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
    setStatus('Backup download started.')
  }

  async function exportFile(chooseDestination = false) {
    start()
    setPrepared(null)
    try {
      const bytes = createBackup(await deviceRepository.snapshot())
      const name = `gear-goblin-${new Date().toISOString().slice(0, 10)}.zip`
      const file = new File([new Uint8Array(bytes)], name, { type: 'application/zip' })
      if (chooseDestination) {
        setPrepared(file)
        if (!isAndroidApp && driveClientId && !drive) {
          try {
            setDrive(await loadDriveAuthorization())
          } catch {
            setError('Google sign-in could not load. You can still download or share the ZIP.')
          }
        }
      } else if (isAndroidApp) {
        try {
          if (await saveAndroidBackup(file)) setStatus('Backup saved.')
        } catch {
          setError('Could not save the backup. Try a different location.')
        }
      } else download(file)
    } catch {
      setError('Could not create a backup. The ZIP limit is 50 MB.')
    } finally {
      setBusy(false)
    }
  }

  async function saveToLocation(file: File) {
    if (!savePicker) return
    start()
    try {
      const handle = await savePicker.call(window, {
        suggestedName: file.name,
        types: [{ description: 'Gear Goblin backup', accept: { 'application/zip': ['.zip'] } }],
      })
      const writer = await handle.createWritable()
      try {
        await writer.write(file)
        await writer.close()
      } catch (error) {
        await writer.abort().catch(() => undefined)
        throw error
      }
      setPrepared(null)
      setStatus('Backup saved.')
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setError('Could not save to that location. Try a different location or download the ZIP.')
      }
    } finally {
      setBusy(false)
    }
  }

  async function shareFile(file: File) {
    start()
    try {
      await navigator.share({ files: [file] })
      setPrepared(null)
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setError('Could not share this backup. You can still download the ZIP.')
      }
    } finally {
      setBusy(false)
    }
  }

  async function saveToDrive(file: File) {
    if (!drive) return
    start()
    try {
      const token = await requestDriveToken(drive)
      if (!token) return
      await uploadDriveBackup(file, token)
      setPrepared(null)
      setStatus('Backup saved to My Drive.')
    } catch (error) {
      setError(error instanceof Error && error.name === 'Error' ? error.message : 'Could not save to Google Drive. You can still download the ZIP.')
    } finally {
      setBusy(false)
    }
  }

  async function choose(file: File) {
    start()
    setPending(null)
    setPrepared(null)
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
      <p>Your collection saves in this browser. Export an unencrypted ZIP to keep a copy of your handhelds, workshop entries, games, and photos somewhere you choose.</p>
      <div className="backup-actions">
        <button className="primary" disabled={busy} onClick={() => void exportFile()}><Download size={17} aria-hidden="true" /> Export collection</button>
        {!isAndroidApp && (savePicker || canShareFiles || driveClientId) && <button className="secondary" disabled={busy} onClick={() => void exportFile(true)}>
          <FolderOpen size={17} aria-hidden="true" /> Choose where to save
        </button>}
        <button className="secondary" disabled={busy} onClick={() => picker.current?.click()}><Upload size={17} aria-hidden="true" /> Choose backup</button>
        <input ref={picker} type="file" aria-label="Backup ZIP" accept=".zip,application/zip" hidden onChange={event => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ''
          if (file) void choose(file)
        }} />
      </div>
      {prepared && <div className="restore-preview">
        <h3>Save backup</h3>
        <p>{prepared.name}</p>
        <div className="backup-actions">
          {drive && <button className="primary" disabled={busy} onClick={() => void saveToDrive(prepared)}>
            <CloudUpload size={17} aria-hidden="true" /> Save to Google Drive
          </button>}
          {savePicker && <button className="primary" disabled={busy} onClick={() => void saveToLocation(prepared)}>
            <FolderOpen size={17} aria-hidden="true" /> Save backup as
          </button>}
          {canShareFiles && navigator.canShare({ files: [prepared] }) &&
            <button className="secondary" disabled={busy} onClick={() => void shareFile(prepared)}>
              <Share2 size={17} aria-hidden="true" /> Share backup
            </button>}
          <button className="secondary" disabled={busy} onClick={() => {
            setError('')
            download(prepared)
            setPrepared(null)
          }}>Download ZIP</button>
          <button className="secondary" disabled={busy} onClick={() => setPrepared(null)}>Cancel</button>
        </div>
      </div>}
      {pending && <div className="restore-preview">
        <h3>Ready to restore</h3>
        <p>Handhelds: {pending.devices.length} · Workshop entries: {pending.records.length} · Photos: {pending.images.length} · Games: {pending.games.length}</p>
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
