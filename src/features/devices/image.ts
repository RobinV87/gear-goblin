export interface DeviceImage { deviceId: string; mime: 'image/jpeg' | 'image/png' | 'image/webp'; data: Uint8Array }
export function validImage(data: Uint8Array, mime: string): boolean {
  if (!data.length || data.length > 5 * 1024 * 1024) return false
  if (mime === 'image/png') return [137,80,78,71,13,10,26,10].every((x, i) => data[i] === x)
  if (mime === 'image/jpeg') return data[0] === 255 && data[1] === 216 && data[2] === 255
  if (mime === 'image/webp') return data.length >= 12 && String.fromCharCode(...data.slice(0, 4)) === 'RIFF' && String.fromCharCode(...data.slice(8, 12)) === 'WEBP'
  return false
}
