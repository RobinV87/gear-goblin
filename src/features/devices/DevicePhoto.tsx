import { useEffect, useRef } from 'react'
import type { DeviceImage } from './image'
export function DevicePhoto({ image, className }: { image: DeviceImage; className?: string }) {
  const ref = useRef<HTMLImageElement>(null)
  useEffect(() => { const url = URL.createObjectURL(new Blob([new Uint8Array(image.data)], { type: image.mime })); if (ref.current) ref.current.src = url; return () => URL.revokeObjectURL(url) }, [image])
  return <img ref={ref} className={className} alt="Your handheld"/>
}
