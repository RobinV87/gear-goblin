import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { deviceRepository } from '../../services/deviceRepository'
import type { Device } from '../devices/model'
import { newWorkshopInput, type RecordKind, type WorkshopInput, type WorkshopRecord } from './model'

const categories = {
  firmware: { title: 'Firmware history', entry: 'firmware entry', name: 'Firmware name' },
  storage: { title: 'Storage configuration', entry: 'storage entry', name: 'Slot or label' },
  accessory: { title: 'Accessories', entry: 'accessory', name: 'Accessory name' },
  maintenance: { title: 'Maintenance log', entry: 'maintenance entry', name: 'Repair or issue' },
  modification: { title: 'Modifications', entry: 'modification', name: 'Modification name' },
} satisfies Record<RecordKind, { title: string; entry: string; name: string }>

const allKinds: RecordKind[] = ['firmware', 'storage', 'accessory', 'modification', 'maintenance']

function RecordForm({ kind, record, close, save }: {
  kind: RecordKind
  record?: WorkshopRecord
  close: () => void
  save: (input: WorkshopInput) => Promise<void>
}) {
  const [form, setForm] = useState<WorkshopInput>(record ?? newWorkshopInput(kind))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await save(form)
      close()
    } catch {
      setError('Could not save this entry. Check the name and try again.')
    } finally {
      setSaving(false)
    }
  }

  function field(key: 'name' | 'version' | 'date' | 'previousFirmware' | 'capacity' | 'purpose' | 'followUpDate', label: string) {
    return (
      <label>
        {label}
        <input type={key === 'date' || key === 'followUpDate' ? 'date' : 'text'} required={key === 'name'} maxLength={120}
          value={form[key] ?? ''} onChange={event => setForm({ ...form, [key]: event.target.value })} />
      </label>
    )
  }

  return (
    <dialog className="dialog" ref={dialogRef} aria-labelledby={titleId} onCancel={event => {
      event.preventDefault()
      if (!saving) close()
    }}>
      <div className="dialog-head">
        <h2 id={titleId}>{record ? 'Edit' : 'Add'} {categories[kind].entry}</h2>
        <button className="icon-button" aria-label="Close entry" disabled={saving} onClick={close}><X size={20} /></button>
      </div>
      <form onSubmit={submit}>
        <div className="fields">
          {field('name', categories[kind].name)}
          {kind === 'firmware' && <>
            {field('version', 'Version')}
            {field('date', 'Installation date')}
            {field('previousFirmware', 'Previous firmware')}
            <label>
              Installation result
              <select value={form.succeeded ? 'success' : 'failed'}
                onChange={event => setForm({ ...form, succeeded: event.target.value === 'success' })}>
                <option value="success">Succeeded</option>
                <option value="failed">Failed</option>
              </select>
            </label>
          </>}
          {kind === 'storage' && <>{field('capacity', 'Capacity')}{field('purpose', 'Purpose')}</>}
          {(kind === 'modification' || kind === 'maintenance') && field('date', 'Date')}
          {kind === 'maintenance' && field('followUpDate', 'Follow-up date')}
        </div>
        <label>
          Notes
          <textarea rows={3} maxLength={5000} value={form.notes}
            onChange={event => setForm({ ...form, notes: event.target.value })} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions">
          <button type="button" className="secondary" disabled={saving} onClick={close}>Cancel</button>
          <button className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save entry'}</button>
        </div>
      </form>
    </dialog>
  )
}

export function Workshop({ deviceId, kind, setupRevision }: { deviceId: string; kind?: RecordKind; setupRevision?: number }) {
  const [records, setRecords] = useState<WorkshopRecord[] | null>(null)
  const [editing, setEditing] = useState<{ kind: RecordKind; record?: WorkshopRecord } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void deviceRepository.listRecords(deviceId).then(result => {
      if (active) setRecords(result)
    }).catch(() => {
      if (active) setError('Could not load workshop entries.')
    })
    return () => { active = false }
  }, [deviceId, setupRevision])

  async function refresh() {
    try {
      setRecords(await deviceRepository.listRecords(deviceId))
      setError('')
    } catch {
      setError('Could not refresh workshop entries. Reopen this view to try again.')
    }
  }

  async function remove(record: WorkshopRecord) {
    if (!window.confirm(`Delete ${record.name}?`)) return
    try {
      await deviceRepository.deleteRecord(record.id)
      await refresh()
    } catch {
      setError('Could not delete this entry. Please try again.')
    }
  }

  return (
    <div className="workshop">
      {!kind && <h3>Workshop</h3>}
      {error && <p className="error" role="alert">{error}</p>}
      <div className={kind ? 'workshop-grid workshop-grid-single' : 'workshop-grid'}>
        {(kind ? [kind] : allKinds).map(category => {
          const entries = records?.filter(record => record.kind === category) ?? []
          const { title, entry } = categories[category]
          return (
            <section className="workshop-panel" key={category}>
              <header className="workshop-heading">
                <h4>{title}</h4>
                <button className="secondary" aria-label={`Add ${entry}`}
                  onClick={() => setEditing({ kind: category })}><Plus size={15} aria-hidden="true" /> Add</button>
              </header>
              {entries.length > 0 ? (
                <ul className="workshop-entries">
                  {entries.map(record => {
                    const summary = [
                      category === 'firmware' && (record.succeeded ? 'Succeeded' : 'Failed'),
                      record.date, record.capacity, record.purpose,
                    ].filter(Boolean).join(' · ')
                    return (
                      <li key={record.id}>
                        <strong>{record.name}{record.version && ` · ${record.version}`}</strong>
                        {summary && <p>{summary}</p>}
                        {record.followUpDate && <p>Follow-up: {record.followUpDate}</p>}
                        {record.previousFirmware && <p>Previous firmware: {record.previousFirmware}</p>}
                        {record.notes && <p className="notes">{record.notes}</p>}
                        <div className="workshop-entry-actions">
                          <button aria-label={`Edit ${record.name}`} onClick={() => setEditing({ kind: category, record })}>Edit</button>
                          <button aria-label={`Delete ${record.name}`} onClick={() => void remove(record)}>Delete</button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              ) : <p>{records ? 'No entries yet.' : error ? 'Entries unavailable.' : 'Loading entries…'}</p>}
            </section>
          )
        })}
      </div>
      {editing && <RecordForm kind={editing.kind} record={editing.record} close={() => setEditing(null)}
        save={async input => {
          await deviceRepository.saveRecord(deviceId, input, editing.record?.id)
          await refresh()
        }} />}
    </div>
  )
}

export function WorkshopPage({ devices, kind, loading }: {
  devices: Device[]
  kind: 'firmware' | 'storage'
  loading: boolean
}) {
  const [deviceId, setDeviceId] = useState('')
  const selected = devices.find(device => device.id === deviceId) ?? devices[0]
  if (loading) return <p>Loading your collection…</p>
  if (!selected) return <p>Add a handheld to your collection to start tracking {kind}.</p>

  return (
    <div className="workshop-page">
      <label>
        Handheld
        <select value={selected.id} onChange={event => setDeviceId(event.target.value)}>
          {devices.map(device => <option value={device.id} key={device.id}>
            {device.nickname ? `${device.nickname} · ` : ''}{device.manufacturer} {device.model}
          </option>)}
        </select>
      </label>
      <Workshop key={selected.id} deviceId={selected.id} kind={kind} />
    </div>
  )
}
