import { useEffect, useId, useRef, useState } from 'react'
import { Gamepad2, Pencil, Trash2, X } from 'lucide-react'
import { Workshop } from '../workshop/Workshop'
import { DevicePhotoSettings } from './DevicePhotoSettings'
import { ModelGuides } from './ModelGuides'
import { SetupCopy } from './SetupCopy'
import { ModelSpecifications } from './ModelSpecifications'
import type { Device } from './model'

interface DeviceDetailsProps {
  device: Device
  devices: Device[]
  onSetupCopied: () => Promise<void>
  error: string
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

export function DeviceDetails({ device, devices, onSetupCopied, error, onClose, onEdit, onDelete }: DeviceDetailsProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const [setupRevision, setSetupRevision] = useState(0)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="dialog device-details"
      aria-labelledby={titleId}
      onCancel={event => {
        event.preventDefault()
        onClose()
      }}
    >
      <header className="device-details-header">
        <span className="device-details-icon"><Gamepad2 size={30} aria-hidden="true" /></span>
        <div className="device-details-title">
          <span>{device.manufacturer}</span>
          <h2 id={titleId}>{device.nickname || device.model}</h2>
          {device.nickname && <p>{device.model}</p>}
        </div>
        <button className="icon-button" aria-label="Close device details" onClick={onClose}><X size={22} /></button>
      </header>
      <div className="device-details-body">
        <section className="personal-details">
          <div className="personal-details-heading">
            <h3>Your details</h3>
            <button className="secondary" onClick={onEdit}><Pencil size={15} aria-hidden="true" /> Edit details</button>
          </div>
          <dl>
            <div><dt>Color or variant</dt><dd>{device.variant || '—'}</dd></div>
            <div><dt>Notes</dt><dd className="notes">{device.notes || '—'}</dd></div>
          </dl>
          <DevicePhotoSettings key={device.id} deviceId={device.id} />
        </section>
        <ModelSpecifications manufacturer={device.manufacturer} model={device.model} expanded />
      </div>
      <div className="device-workshop">
        <Workshop key={device.id} deviceId={device.id} setupRevision={setupRevision} />
        <SetupCopy deviceId={device.id} devices={devices} onCopied={() => {
          setSetupRevision(revision => revision + 1)
          void onSetupCopied()
        }} />
        <ModelGuides manufacturer={device.manufacturer} model={device.model} />
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <footer className="device-details-footer">
        <button className="device-delete" onClick={onDelete}><Trash2 size={16} aria-hidden="true" /> Delete handheld</button>
      </footer>
    </dialog>
  )
}
