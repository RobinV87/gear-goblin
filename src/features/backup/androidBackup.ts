import { Capacitor, registerPlugin } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'

const BackupSave = registerPlugin<{
  chooseDestination(options: { staged: string; suggested: string }): Promise<{ saved: boolean }>
}>('BackupSave')

export const isAndroidApp = Capacitor.getPlatform() === 'android' && Capacitor.isNativePlatform()

function fileAsBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',', 2)[1])
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export async function saveAndroidBackup(file: File) {
  const staged = `${crypto.randomUUID()}.zip`
  const path = `backups/${staged}`
  const directory = Directory.Cache
  const chunkSize = 256 * 1024

  try {
    for (let offset = 0; offset < file.size; offset += chunkSize) {
      const data = await fileAsBase64(file.slice(offset, offset + chunkSize))
      if (offset === 0) await Filesystem.writeFile({ path, directory, data, recursive: true })
      else await Filesystem.appendFile({ path, directory, data })
    }
    const result = await BackupSave.chooseDestination({ staged, suggested: file.name })
    return result.saved
  } finally {
    await Filesystem.deleteFile({ path, directory }).catch(() => undefined)
  }
}
