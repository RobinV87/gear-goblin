import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { deviceRepository } from '../../services/deviceRepository'
import type { Device } from '../devices/model'
import type { Game, GameInput } from './model'

function GameForm({ game, deviceId, devices, close }: {
  game: Game | null
  deviceId: string
  devices: Device[]
  close: () => void
}) {
  const [form, setForm] = useState<GameInput>(game ?? { title: '', system: '', deviceIds: [deviceId] })
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
      await deviceRepository.saveGame(form, game?.id)
      close()
    } catch (error) {
      setError(error instanceof Error && error.name === 'Error' ? error.message : 'Could not save this game.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <dialog className="dialog" ref={dialogRef} aria-labelledby={titleId} onCancel={event => {
      event.preventDefault()
      if (!saving) close()
    }}>
      <div className="dialog-head">
        <h2 id={titleId}>{game ? 'Edit game' : 'Add game'}</h2>
        <button className="icon-button" aria-label="Close game form" disabled={saving} onClick={close}><X size={20} /></button>
      </div>
      <form onSubmit={submit}>
        <div className="fields">
          <label>Game title<input required maxLength={160} value={form.title}
            onChange={event => setForm({ ...form, title: event.target.value })} /></label>
          <label>System<input required maxLength={120} value={form.system} placeholder="e.g. Game Boy Advance"
            onChange={event => setForm({ ...form, system: event.target.value })} /></label>
        </div>
        <fieldset className="game-handhelds">
          <legend>Available on</legend>
          {devices.map(device => <label key={device.id}>
            <input type="checkbox" checked={form.deviceIds.includes(device.id)} onChange={event => {
              const checked = event.currentTarget.checked
              setForm(current => ({
                ...current,
                deviceIds: checked ? [...current.deviceIds, device.id] : current.deviceIds.filter(id => id !== device.id),
              }))
            }} />
            {device.nickname ? `${device.nickname} · ` : ''}{device.manufacturer} {device.model}
          </label>)}
        </fieldset>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions">
          <button className="secondary" type="button" disabled={saving} onClick={close}>Cancel</button>
          <button className="primary" disabled={saving || !form.deviceIds.length}>{saving ? 'Saving…' : 'Save game'}</button>
        </div>
      </form>
    </dialog>
  )
}

export function DeviceGames({ deviceId, devices, games, unavailable }: {
  deviceId: string
  devices: Device[]
  games: Game[]
  unavailable: boolean
}) {
  const [editing, setEditing] = useState<Game | null | undefined>()
  const [error, setError] = useState('')
  const groups = new Map<string, { system: string; games: Game[] }>()
  for (const game of games) {
    const key = game.system.trim().replace(/\s+/g, ' ').toLowerCase()
    const group = groups.get(key) ?? { system: game.system, games: [] }
    group.games.push(game)
    groups.set(key, group)
  }
  const systems = [...groups.values()].sort((a, b) => a.system.localeCompare(b.system))

  async function remove(game: Game) {
    if (!window.confirm(`Delete ${game.title} from all its handhelds?`)) return
    try {
      await deviceRepository.deleteGame(game.id)
      setError('')
    } catch {
      setError('Could not delete this game.')
    }
  }

  return (
    <section className="workshop-panel device-games">
      <header className="workshop-heading">
        <h3>Games <span className="count">{games.length}</span></h3>
        <button className="secondary" onClick={() => setEditing(null)}><Plus size={15} aria-hidden="true" /> Add game</button>
      </header>
      {unavailable && <p className="error" role="alert">Could not load games.</p>}
      {error && <p className="error" role="alert">{error}</p>}
      {!unavailable && systems.length === 0 && <p>No games logged for this handheld.</p>}
      {systems.map(({ system, games }) => (
        <section className="game-system" key={system}>
          <h4>{system}</h4>
          <ul className="workshop-entries">
            {games.sort((a, b) => a.title.localeCompare(b.title)).map(game => <li key={game.id}>
              <strong>{game.title}</strong>
              <div className="workshop-entry-actions">
                <button aria-label={`Edit ${game.title}`} onClick={() => setEditing(game)}>Edit</button>
                <button aria-label={`Delete ${game.title}`} onClick={() => void remove(game)}>Delete</button>
              </div>
            </li>)}
          </ul>
        </section>
      ))}
      {editing !== undefined && <GameForm game={editing} deviceId={deviceId} devices={devices} close={() => setEditing(undefined)} />}
    </section>
  )
}
