import { useEffect, useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { deviceRepository } from '../../services/deviceRepository'
import { DevicePhoto } from './DevicePhoto'
import { validImage, type DeviceImage } from './image'

export function DevicePhotoSettings({ deviceId }: { deviceId: string }) {
  const [image, setImage] = useState<DeviceImage>()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(true)
  const picker = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let active = true
    void deviceRepository.getImage(deviceId).then(photo => {
      if (active) setImage(photo)
    }).catch(() => {
      if (active) setError('Could not load the photo.')
    }).finally(() => {
      if (active) setBusy(false)
    })
    return () => { active = false }
  }, [deviceId])

  async function save(file?: File) {
    setBusy(true)
    setError('')
    try {
      let photo: DeviceImage | null = null
      if (file) {
        const mime = file.type
        if (file.size > 5 * 1024 * 1024 || (mime !== 'image/jpeg' && mime !== 'image/png' && mime !== 'image/webp')) {
          setError('Choose a JPEG, PNG, or WebP photo up to 5 MB.')
          return
        }
        const data = new Uint8Array(await file.arrayBuffer())
        if (!validImage(data, mime)) {
          setError('This file is not a supported photo.')
          return
        }
        const bitmap = await createImageBitmap(file)
        bitmap.close()
        photo = { deviceId, mime, data }
      }
      await deviceRepository.setImage(deviceId, photo)
      setImage(photo ?? undefined)
    } catch {
      setError('Could not update the photo. Try again with a valid image.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="device-photo-panel">
      <h3>Device photo</h3>
      {image && <DevicePhoto image={image} className="device-photo-preview" />}
      <div className="backup-actions">
        <button className="secondary" disabled={busy} onClick={() => picker.current?.click()}>
          <Camera size={16} aria-hidden="true" /> {image ? 'Replace photo' : 'Add photo'}
        </button>
        {image && <button className="device-delete" disabled={busy} onClick={() => {
          if (window.confirm('Remove this device photo?')) void save()
        }}>Remove photo</button>}
      </div>
      <input ref={picker} type="file" aria-label="Device photo file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => {
        const file = event.currentTarget.files?.[0]
        event.currentTarget.value = ''
        if (file) void save(file)
      }} />
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  )
}
