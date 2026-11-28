import { App as NativeApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Boxes, ChevronRight, Gamepad2, HardDrive, Plus, Settings, Smartphone, Wrench, LayoutGrid, List, X } from 'lucide-react'
import { BackupSettings } from '../features/backup/BackupSettings'
import { CollectionFilters } from '../features/devices/CollectionFilters'
import { filterDevices, normalizedSearch, useFirmwareRecords } from '../features/devices/collectionSearch'
import { DeviceDetails } from '../features/devices/DeviceDetails'
import { ModelSpecifications } from '../features/devices/ModelSpecifications'
import { SuggestedField } from '../features/devices/SuggestedField'
import { getHandheldModels, handheldManufacturers } from '../features/devices/handheldCatalog'
import { type Device, type DeviceInput } from '../features/devices/model'
import { WorkshopPage } from '../features/workshop/Workshop'
import { deviceRepository } from '../services/deviceRepository'

type Section = 'Collection' | 'Devices' | 'Firmware' | 'Storage' | 'Settings'
const sections: { name: Section; icon: typeof Boxes }[] = [{ name: 'Collection', icon: Boxes }, { name: 'Devices', icon: Smartphone }, { name: 'Firmware', icon: Wrench }, { name: 'Storage', icon: HardDrive }, { name: 'Settings', icon: Settings }]
const empty: DeviceInput = { manufacturer: '', model: '', nickname: '', variant: '', notes: '' }
function Goblin() { return <svg className="goblin" viewBox="0 0 100 100" aria-hidden="true"><path fill="#90a67c" d="M25 36 5 22l9 30c-2 25 14 38 36 38s38-13 36-38l9-30-20 14C62 24 38 24 25 36Z"/><path fill="#29352a" d="M28 52c5-5 12-5 17 0l-3 8-11-1zm27 0c5-5 12-5 17 0l-3 7-11 1z"/><path d="M40 72q10 7 20 0" fill="none" stroke="#29352a" strokeWidth="4" strokeLinecap="round"/></svg> }
function DeviceForm({ device, close, saved }: { device: Device | null; close: () => void; saved: () => Promise<void> }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  const [form, setForm] = useState<DeviceInput>(device ?? empty)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  async function submit(event: FormEvent) { event.preventDefault(); setSaving(true); setError(''); try { if (device) await deviceRepository.update(device.id, form); else await deviceRepository.create(form); await saved(); close() } catch { setError('Could not save this device. Check the required fields and try again.') } finally { setSaving(false) } }
  const models = getHandheldModels(form.manufacturer)
  function field(key: keyof DeviceInput, label: string, required = false, suggestions?: readonly string[]) {
    if (suggestions) {
      return <SuggestedField label={label} value={form[key]} suggestions={suggestions}
        onChange={value => setForm(current => ({ ...current, [key]: value }))} />
    }
    return (
      <label>
        {label}{required && ' *'}
        <input
          required={required}
          maxLength={120}
          value={form[key]}
          onChange={event => setForm(current => ({ ...current, [key]: event.target.value }))}
        />
      </label>
    )
  }
  return <dialog ref={dialogRef} className="dialog" aria-labelledby="form-title" onCancel={event => {
    event.preventDefault()
    if (!saving) close()
  }}><div className="dialog-head"><div><span className="eyebrow">YOUR COLLECTION</span><h2 id="form-title">{device ? 'Edit handheld' : 'Add a handheld'}</h2></div><button className="icon-button" aria-label="Close" onClick={close}><X /></button></div><form onSubmit={submit}><div className="fields">{field('manufacturer', 'Manufacturer', true, handheldManufacturers)}{field('model', 'Model', true, models)}{field('nickname', 'Nickname')}{field('variant', 'Color or variant')}</div><ModelSpecifications manufacturer={form.manufacturer} model={form.model} /><label>Notes<textarea rows={3} maxLength={5000} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>{error && <p className="error" role="alert">{error}</p>}<div className="actions"><button type="button" className="secondary" onClick={close}>Cancel</button><button className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save handheld'}</button></div></form></dialog>
}
export default function App() {
  const [section, setSection] = useState<Section>('Collection'); const [devices, setDevices] = useState<Device[]>([]); const [editing, setEditing] = useState<Device | null | undefined>(undefined); const [view, setView] = useState<'grid' | 'list'>('grid'); const [error, setError] = useState(''); const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return
    const listener = NativeApp.addListener('backButton', () => {
      const dialogs = document.querySelectorAll<HTMLDialogElement>('dialog[open]')
      const dialog = dialogs[dialogs.length - 1]
      if (dialog) {
        if (dialog.dispatchEvent(new Event('cancel', { cancelable: true }))) dialog.close()
      } else if (section !== 'Collection') {
        setSection('Collection')
      } else {
        void NativeApp.minimizeApp()
      }
    })
    return () => { void listener.then(handle => handle.remove()) }
  }, [section])

  const [search, setSearch] = useState('')
  const [manufacturerFilter, setManufacturerFilter] = useState('')
  const [firmwareFilter, setFirmwareFilter] = useState('')
  const { records: firmwareRecords, unavailable: firmwareUnavailable } = useFirmwareRecords()
  const manufacturer = devices.some(device => normalizedSearch(device.manufacturer) === manufacturerFilter) ? manufacturerFilter : ''
  const firmware = firmwareRecords.some(record => normalizedSearch(record.name) === firmwareFilter) ? firmwareFilter : ''
  const visibleDevices = filterDevices(devices, firmwareRecords, search, manufacturer, firmware)
  const filtering = Boolean(search.trim() || manufacturer || firmware)
  function clearFilters() {
    setSearch('')
    setManufacturerFilter('')
    setFirmwareFilter('')
  }

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const cardTrigger = useRef<HTMLButtonElement>(null)
  const addButton = useRef<HTMLButtonElement>(null)
  const selectedDevice = devices.find(device => device.id === selectedId)
  function closeDetails(deleted = false) {
    setSelectedId(null)
    requestAnimationFrame(() => (deleted || !cardTrigger.current?.isConnected ? addButton : cardTrigger).current?.focus())
  }

  const refresh = useCallback(async () => { try { setDevices(await deviceRepository.list()); setError('') } catch { setError('Unable to load your collection. Check browser storage permissions and try again.') } finally { setLoading(false) } }, [])
  useEffect(() => {
    let active = true
    void deviceRepository.list().then(result => { if (active) setDevices(result) }).catch(() => { if (active) setError('Unable to load your collection. Check browser storage permissions and try again.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  async function remove(device: Device) { if (!window.confirm(`Delete ${device.nickname || `${device.manufacturer} ${device.model}`} and its workshop entries and photo? This cannot be undone.`)) return; try { await deviceRepository.delete(device.id); closeDetails(true); await refresh() } catch { setError('Could not delete this device. Please try again.') } }
  const collection = section === 'Collection' || section === 'Devices'
  return <div className="shell"><aside className="sidebar"><div className="brand"><Goblin/><div><strong>GEAR GOBLIN</strong><small>YOUR HANDHELD HOARD</small></div></div><div className="sidebar-label">THE GARAGE</div><nav aria-label="Main navigation">{sections.map(({ name, icon: Icon }) => <button key={name} className={section === name ? 'nav active' : 'nav'} aria-current={section === name ? 'page' : undefined} onClick={() => setSection(name)}><Icon size={19}/><span>{name}</span></button>)}</nav><div className="sidebar-foot">MADE FOR YOUR<br/><b>PLAYER TWO.</b></div></aside><main><header className="topbar"><span>YOUR DIGITAL GARAGE <span className="slash">/</span> {section.toUpperCase()}</span><span className="offline"><i/> OFFLINE &amp; PRIVATE</span></header><div className="content">{collection ? <><div className="heading"><div><span className="eyebrow">THE GOOD STUFF, ALL IN ONE PLACE</span><h1>{section === 'Collection' ? 'Your collection' : 'Your devices'}<span className="orange">.</span></h1><p>Give every handheld in your hoard a home.</p></div><button className="primary add" ref={addButton} onClick={() => setEditing(null)}><Plus size={19}/> Add handheld</button></div><div className="overview"><div><span className="eyebrow">THE HOARD AT A GLANCE</span><div className="stat"><strong>{devices.length.toString().padStart(2, '0')}</strong><span>HANDHELDS<br/>IN YOUR COLLECTION</span></div></div><div className="overview-art"><Gamepad2 size={86} strokeWidth={1}/><span>READY<br/>PLAYER ONE</span></div></div><div className="list-heading"><div><span className="eyebrow">THE LINEUP</span><h2>All handhelds <span className="count" aria-live="polite">{filtering ? `${visibleDevices.length} of ${devices.length}` : devices.length}</span></h2></div><div className="view-toggle" aria-label="Collection view"><button aria-label="Grid view" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><LayoutGrid size={18}/></button><button aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={18}/></button></div></div>{devices.length > 0 && (
  <CollectionFilters devices={devices} records={firmwareRecords} unavailable={firmwareUnavailable}
    search={search} manufacturer={manufacturer} firmware={firmware} onSearch={setSearch}
    onManufacturer={setManufacturerFilter} onFirmware={setFirmwareFilter} onClear={clearFilters} />
)}{error && <p className="error" role="alert">{error}</p>}{loading ? <p>Loading your collection…</p> : devices.length === 0 ? <div className="empty"><Goblin/><h3>Your hoard starts here.</h3><p>Add your first handheld and make this garage your own.</p><button className="secondary" onClick={() => setEditing(null)}><Plus size={17}/> Add your first handheld</button></div> : visibleDevices.length === 0 ? <p>No handhelds match your filters.</p> : <div className={view === 'grid' ? 'device-grid' : 'device-list'}>{visibleDevices.map(device => <article className="card" key={device.id}>
  <button
    type="button"
    className="device-card-open"
    aria-label={`Open ${device.nickname || device.model}`}
    onClick={event => {
      cardTrigger.current = event.currentTarget
      setSelectedId(device.id)
    }}
  >
    <span className="card-art"><Gamepad2 size={54} strokeWidth={1.3} aria-hidden="true" /></span>
    <span className="card-body">
      <span className="eyebrow">{device.manufacturer}</span>
      <span className="device-card-title">{device.nickname || device.model}</span>
      {(device.nickname || device.variant) && <span className="device-card-meta">
        {[device.nickname && device.model, device.variant].filter(Boolean).join(' · ')}
      </span>}
    </span>
    <ChevronRight className="device-card-arrow" size={20} aria-hidden="true" />
  </button>
</article>)}</div>}</> : <><span className="eyebrow">THE GARAGE</span><h1>{section}<span className="orange">.</span></h1>{section === 'Settings' ? <><BackupSettings refresh={refresh} /><div className="placeholder"><h2>About Gear Goblin</h2><p>Your handheld hoard, organized. Your collection stays on this device; no account or online service is required.</p><p>Milestone 1C</p></div></> : <WorkshopPage key={section} devices={devices} loading={loading} kind={section === 'Firmware' ? 'firmware' : 'storage'} />}</>}</div></main><nav className="mobile-nav" aria-label="Main navigation">{sections.map(({ name, icon: Icon }) => <button key={name} className={section === name ? 'selected' : ''} aria-current={section === name ? 'page' : undefined} onClick={() => setSection(name)}><Icon size={20}/><span>{name}</span></button>)}</nav>{selectedDevice && editing === undefined && (
  <DeviceDetails
    device={selectedDevice}
    devices={devices}
    onSetupCopied={refresh}
    error={error}
    onClose={() => closeDetails()}
    onEdit={() => setEditing(selectedDevice)}
    onDelete={() => void remove(selectedDevice)}
  />
)}{editing !== undefined && <DeviceForm device={editing} close={() => setEditing(undefined)} saved={refresh}/>}</div>
}
