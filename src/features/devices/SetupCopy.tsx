import { useId, useState, type FormEvent } from 'react'
import { deviceRepository } from '../../services/deviceRepository'
import type { Device } from './model'

export function SetupCopy({ deviceId, devices, onCopied }: {
  deviceId: string
  devices: Device[]
  onCopied: () => void
}) {
  const [source, setSource] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean }>()
  const titleId = useId()
  const sources = devices.filter(device => device.id !== deviceId)
  if (!sources.length) return null

  async function copy(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setFeedback(undefined)
    try {
      await deviceRepository.copySetup(source, deviceId)
      onCopied()
      setFeedback({ text: 'Setup copied. Existing slots and accessories with the same name were kept.' })
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Try again.'
      setFeedback({ text: `Could not copy setup. ${text}`, error: true })
    } finally {
      setBusy(false)
    }
  }

  return (
    <details className="workshop-panel setup-copy" aria-labelledby={titleId}>
      <summary id={titleId}>Copy a setup</summary>
      <p>Use another handheld as a template for storage slots, accessories, and device notes.</p>
      <form onSubmit={copy}>
        <label>
          Source handheld
          <select aria-label="Source handheld" required value={source} onChange={event => setSource(event.target.value)} disabled={busy}>
            <option value="">Choose a handheld</option>
            {sources.map(device => <option key={device.id} value={device.id}>
              {device.nickname ? `${device.nickname} · ` : ''}{device.manufacturer} {device.model}
            </option>)}
          </select>
        </label>
        <button className="secondary" disabled={!source || busy}>{busy ? 'Copying…' : 'Copy setup'}</button>
      </form>
      {feedback && <p role={feedback.error ? 'alert' : 'status'}>{feedback.text}</p>}
    </details>
  )
}
