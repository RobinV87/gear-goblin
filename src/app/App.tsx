import { useCallback, useEffect, useId, useState, type FormEvent } from 'react'
import { Boxes, Gamepad2, HardDrive, Plus, Settings, Smartphone, Wrench, LayoutGrid, List, Pencil, Trash2, X } from 'lucide-react'
import { anbernicModels } from '../features/devices/anbernicModels'
import { type Device, type DeviceInput } from '../features/devices/model'
import { deviceRepository } from '../services/deviceRepository'

type Section = 'Collection' | 'Devices' | 'Firmware' | 'Storage' | 'Settings'
const sections: { name: Section; icon: typeof Boxes }[] = [{ name: 'Collection', icon: Boxes }, { name: 'Devices', icon: Smartphone }, { name: 'Firmware', icon: Wrench }, { name: 'Storage', icon: HardDrive }, { name: 'Settings', icon: Settings }]
const empty: DeviceInput = { manufacturer: '', model: '', nickname: '', variant: '', notes: '' }
function Goblin() { return <svg className="goblin" viewBox="0 0 100 100" aria-hidden="true"><path fill="#90a67c" d="M25 36 5 22l9 30c-2 25 14 38 36 38s38-13 36-38l9-30-20 14C62 24 38 24 25 36Z"/><path fill="#29352a" d="M28 52c5-5 12-5 17 0l-3 8-11-1zm27 0c5-5 12-5 17 0l-3 7-11 1z"/><path d="M40 72q10 7 20 0" fill="none" stroke="#29352a" strokeWidth="4" strokeLinecap="round"/></svg> }
function DeviceForm({ device, close, saved }: { device: Device | null; close: () => void; saved: () => Promise<void> }) {
  const catalogId = useId()
  const [form, setForm] = useState<DeviceInput>(device ?? empty)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  async function submit(event: FormEvent) { event.preventDefault(); setSaving(true); setError(''); try { if (device) await deviceRepository.update(device.id, form); else await deviceRepository.create(form); await saved(); close() } catch { setError('Could not save this device. Check the required fields and try again.') } finally { setSaving(false) } }
  const isAnbernic = form.manufacturer.trim().toLowerCase() === 'anbernic'
  function field(key: keyof DeviceInput, label: string, required = false, suggestions?: readonly string[]) {
    const listId = `${catalogId}-${key}`
    return (
      <label>
        {label}{required && ' *'}
        <input
          required={required}
          list={suggestions && listId}
          maxLength={120}
          value={form[key]}
          onChange={event => setForm(current => ({ ...current, [key]: event.target.value }))}
        />
        {suggestions && (
          <datalist id={listId}>
            {suggestions.map(value => <option key={value} value={value} />)}
          </datalist>
        )}
      </label>
    )
  }
  return <div className="overlay"><section className="dialog" role="dialog" aria-modal="true" aria-labelledby="form-title"><div className="dialog-head"><div><span className="eyebrow">YOUR COLLECTION</span><h2 id="form-title">{device ? 'Edit handheld' : 'Add a handheld'}</h2></div><button className="icon-button" aria-label="Close" onClick={close}><X /></button></div><form onSubmit={submit}><div className="fields">{field('manufacturer', 'Manufacturer', true, ['Anbernic'])}{field('model', 'Model', true, isAnbernic ? anbernicModels : undefined)}{field('nickname', 'Nickname')}{field('variant', 'Color or variant')}</div><label>Notes<textarea rows={3} maxLength={5000} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></label>{error && <p className="error" role="alert">{error}</p>}<div className="actions"><button type="button" className="secondary" onClick={close}>Cancel</button><button className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save handheld'}</button></div></form></section></div>
}
export default function App() {
  const [section, setSection] = useState<Section>('Collection'); const [devices, setDevices] = useState<Device[]>([]); const [editing, setEditing] = useState<Device | null | undefined>(undefined); const [view, setView] = useState<'grid' | 'list'>('grid'); const [error, setError] = useState(''); const [loading, setLoading] = useState(true)
  const refresh = useCallback(async () => { try { setDevices(await deviceRepository.list()); setError('') } catch { setError('Unable to load your collection. Check browser storage permissions and try again.') } finally { setLoading(false) } }, [])
  useEffect(() => {
    let active = true
    void deviceRepository.list().then(result => { if (active) setDevices(result) }).catch(() => { if (active) setError('Unable to load your collection. Check browser storage permissions and try again.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  async function remove(device: Device) { if (!window.confirm(`Delete ${device.nickname || `${device.manufacturer} ${device.model}`}? This cannot be undone.`)) return; try { await deviceRepository.delete(device.id); await refresh() } catch { setError('Could not delete this device. Please try again.') } }
  const collection = section === 'Collection' || section === 'Devices'
  return <div className="shell"><aside className="sidebar"><div className="brand"><Goblin/><div><strong>GEAR GOBLIN</strong><small>YOUR HANDHELD HOARD</small></div></div><div className="sidebar-label">THE GARAGE</div><nav aria-label="Main navigation">{sections.map(({ name, icon: Icon }) => <button key={name} className={section === name ? 'nav active' : 'nav'} aria-current={section === name ? 'page' : undefined} onClick={() => setSection(name)}><Icon size={19}/><span>{name}</span></button>)}</nav><div className="sidebar-foot">MADE FOR YOUR<br/><b>PLAYER TWO.</b></div></aside><main><header className="topbar"><span>YOUR DIGITAL GARAGE <span className="slash">/</span> {section.toUpperCase()}</span><span className="offline"><i/> OFFLINE &amp; PRIVATE</span></header><div className="content">{collection ? <><div className="heading"><div><span className="eyebrow">THE GOOD STUFF, ALL IN ONE PLACE</span><h1>{section === 'Collection' ? 'Your collection' : 'Your devices'}<span className="orange">.</span></h1><p>Give every handheld in your hoard a home.</p></div><button className="primary add" onClick={() => setEditing(null)}><Plus size={19}/> Add handheld</button></div><div className="overview"><div><span className="eyebrow">THE HOARD AT A GLANCE</span><div className="stat"><strong>{devices.length.toString().padStart(2, '0')}</strong><span>HANDHELDS<br/>IN YOUR COLLECTION</span></div></div><div className="overview-art"><Gamepad2 size={86} strokeWidth={1}/><span>READY<br/>PLAYER ONE</span></div></div><div className="list-heading"><div><span className="eyebrow">THE LINEUP</span><h2>All handhelds <span className="count">{devices.length}</span></h2></div><div className="view-toggle" aria-label="Collection view"><button aria-label="Grid view" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><LayoutGrid size={18}/></button><button aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={18}/></button></div></div>{error && <p className="error" role="alert">{error}</p>}{loading ? <p>Loading your collection…</p> : devices.length === 0 ? <div className="empty"><Goblin/><h3>Your hoard starts here.</h3><p>Add your first handheld and make this garage your own.</p><button className="secondary" onClick={() => setEditing(null)}><Plus size={17}/> Add your first handheld</button></div> : <div className={view === 'grid' ? 'device-grid' : 'device-list'}>{devices.map(device => <article className="card" key={device.id}><div className="card-art"><Gamepad2 size={64} strokeWidth={1.2}/><span>HANDHELD</span></div><div className="card-body"><span className="eyebrow">{device.manufacturer}</span><h3>{device.nickname || device.model}</h3><p>{device.nickname ? device.model : device.variant || 'Handheld gaming device'}</p>{device.nickname && device.variant && <p>{device.variant}</p>}{device.notes && <p className="notes">{device.notes}</p>}<div className="card-actions"><button onClick={() => setEditing(device)} aria-label={`Edit ${device.nickname || device.model}`}><Pencil size={16}/> Edit</button><button onClick={() => void remove(device)} aria-label={`Delete ${device.nickname || device.model}`}><Trash2 size={16}/> Delete</button></div></div></article>)}</div>}</> : <><span className="eyebrow">THE GARAGE</span><h1>{section}<span className="orange">.</span></h1>{section === 'Settings' ? <div className="placeholder"><h2>About Gear Goblin</h2><p>Your handheld hoard, organized. Your collection stays on this device; no account or online service is required.</p><p>Version 0.1.0 · Milestone 1A</p><p>Theme preferences, backup, restore and optional donation information are planned for a later milestone.</p></div> : <div className="placeholder"><h2>Coming to the garage</h2><p>{section === 'Firmware' ? 'Firmware history will be available in Milestone 1B.' : 'Storage configurations will be available in Milestone 1B.'}</p></div>}</>}</div></main><nav className="mobile-nav" aria-label="Main navigation">{sections.map(({ name, icon: Icon }) => <button key={name} className={section === name ? 'selected' : ''} aria-current={section === name ? 'page' : undefined} onClick={() => setSection(name)}><Icon size={20}/><span>{name}</span></button>)}</nav>{editing !== undefined && <DeviceForm device={editing} close={() => setEditing(undefined)} saved={refresh}/>}</div>
}
