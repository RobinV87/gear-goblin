interface GoogleTokenResponse {
  access_token?: string
  error?: string
}

interface GoogleTokenApi {
  initTokenClient(options: {
    client_id: string
    scope: string
    callback: (response: GoogleTokenResponse) => void
    error_callback: (error: { type: string }) => void
  }): { requestAccessToken(options: { prompt: string }): void }
}

const googleScript = 'https://accounts.google.com/gsi/client'
const uploadEndpoint = 'https://www.googleapis.com/upload/drive/v3/files'
const scope = 'https://www.googleapis.com/auth/drive.file'
export const driveClientId = ((import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID as string | undefined) ?? '').trim()
let loading: Promise<GoogleTokenApi> | undefined

function tokenApi() {
  return (window as Window & { google?: { accounts?: { oauth2?: GoogleTokenApi } } }).google?.accounts?.oauth2
}

export function loadDriveAuthorization(): Promise<GoogleTokenApi> {
  const existing = tokenApi()
  if (existing) return Promise.resolve(existing)
  if (loading) return loading

  loading = new Promise<GoogleTokenApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = googleScript
    script.async = true
    const timeout = window.setTimeout(fail, 12_000)
    function fail() {
      window.clearTimeout(timeout)
      script.remove()
      reject(new Error('Google sign-in could not load.'))
    }
    script.onerror = fail
    script.onload = () => {
      const api = tokenApi()
      if (!api) return fail()
      window.clearTimeout(timeout)
      resolve(api)
    }
    document.head.append(script)
  }).catch(error => {
    loading = undefined
    throw error
  })

  return loading
}

export function requestDriveToken(api: GoogleTokenApi): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const client = api.initTokenClient({
      client_id: driveClientId,
      scope,
      callback: response => {
        if (response.access_token && !response.error) resolve(response.access_token)
        else if (response.error === 'access_denied') resolve(null)
        else reject(new Error('Google Drive authorization failed.'))
      },
      error_callback: error => {
        if (error.type === 'popup_closed') resolve(null)
        else reject(new Error('Google sign-in could not open. Check your browser’s pop-up settings.'))
      },
    })
    client.requestAccessToken({ prompt: 'select_account' })
  })
}

async function uploadRequest(url: string, init: RequestInit) {
  const response = await fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(120_000) })
  if (response.status === 401) throw new Error('Google Drive authorization expired. Try again to reconnect.')
  if (!response.ok) throw new Error('Google Drive did not accept the upload. Try again or download the ZIP.')
  return response
}

export async function uploadDriveBackup(file: File, token: string) {
  const authorization = { Authorization: `Bearer ${token}` }
  const metadata = JSON.stringify({ name: file.name, mimeType: file.type })

  if (file.size <= 5 * 1024 * 1024) {
    const boundary = crypto.randomUUID()
    const body = new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
      `--${boundary}\r\nContent-Type: application/zip\r\n\r\n`, file, `\r\n--${boundary}--\r\n`,
    ])
    await uploadRequest(`${uploadEndpoint}?uploadType=multipart`, {
      method: 'POST',
      headers: { ...authorization, 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    })
    return
  }

  const session = await uploadRequest(`${uploadEndpoint}?uploadType=resumable`, {
    method: 'POST',
    headers: {
      ...authorization,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': file.type,
      'X-Upload-Content-Length': String(file.size),
    },
    body: metadata,
  })
  const location = session.headers.get('Location')
  if (!location || !location.startsWith(`${uploadEndpoint}?`)) {
    throw new Error('Google Drive did not provide an upload session. You can still download the ZIP.')
  }
  await uploadRequest(location, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
}
