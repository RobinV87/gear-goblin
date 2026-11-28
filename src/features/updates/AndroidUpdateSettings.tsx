import { registerPlugin } from '@capacitor/core'
import { App } from '@capacitor/app'
import { useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { androidBuildsPage, findAndroidBuild } from './githubBuilds'

const AndroidUpdate = registerPlugin<{
  downloadAndInstall(options: { build: number }): Promise<{ status: 'permission' | 'installer' }>
}>('AndroidUpdate')

type UpdateResult = {
  message: string
  available?: { build: number; url: string }
  error?: boolean
}

export function AndroidUpdateSettings() {
  const [busy, setBusy] = useState<'checking' | 'downloading'>()
  const [installMessage, setInstallMessage] = useState('')
  const [installError, setInstallError] = useState('')
  const [result, setResult] = useState<UpdateResult>()

  async function check() {
    setBusy('checking')
    setInstallMessage('')
    setInstallError('')
    setResult(undefined)
    try {
      const { version, build } = await App.getInfo()
      const installedBuild = Number(build)
      if (!Number.isSafeInteger(installedBuild) || installedBuild < 1) {
        throw new Error('Could not read the installed Android build number.')
      }
      const available = await findAndroidBuild()
      if (!available) {
        setResult({ message: 'There’s no downloadable Android build on GitHub right now.' })
      } else if (available.build > installedBuild) {
        setResult({
          message: `Build ${available.build} is available. You have ${version} (build ${build}).`,
          available,
        })
      } else {
        setResult({ message: `You’re up to date with the available GitHub build. Installed: ${version} (build ${build}).` })
      }
    } catch (error) {
      const message = error instanceof TypeError || !(error instanceof Error) || error.name !== 'Error'
        ? 'Could not check for updates. Check your internet connection and try again.'
        : error.message
      setResult({ message, error: true })
    } finally {
      setBusy(undefined)
    }
  }

  async function install(build: number) {
    setBusy('downloading')
    setInstallMessage('')
    setInstallError('')
    try {
      const { status } = await AndroidUpdate.downloadAndInstall({ build })
      setInstallMessage(status === 'permission'
        ? 'Allow installs from Gear Goblin in Android Settings, then return and tap Download & install again.'
        : 'Confirm the update in Android’s installer.')
    } catch (error) {
      const signerMismatch = error instanceof Error && 'code' in error && error.code === 'SIGNER_MISMATCH'
      setInstallError(signerMismatch
        ? 'This build uses a different signing key. Export a collection backup before switching builds.'
        : 'Could not open the Android update. You can download the APK directly from GitHub.')
    } finally {
      setBusy(undefined)
    }
  }

  const available = result?.available
  return (
    <section className="placeholder">
      <h2>Android updates</h2>
      <div className="backup-actions">
        <button className="secondary" disabled={Boolean(busy)} onClick={() => void check()}>
          <RefreshCw size={16} aria-hidden="true" /> {busy === 'checking' ? 'Checking GitHub…' : 'Check for updates'}
        </button>
      </div>
      {result && <p role={result.error ? 'alert' : 'status'}>{result.message}</p>}
      {available && <>
        <div className="backup-actions">
          <button className="primary" disabled={Boolean(busy)} onClick={() => void install(available.build)}>
            <Download size={16} aria-hidden="true" /> {busy === 'downloading' ? 'Downloading APK…' : 'Download & install'}
          </button>
        </div>
        <p><a href={available.url} target="_blank" rel="noreferrer">Download APK from GitHub</a></p>
      </>}
      {installMessage && <p role="status">{installMessage}</p>}
      {installError && <p className="error" role="alert">{installError}</p>}
      {result && !result.available && <p><a href={androidBuildsPage} target="_blank" rel="noreferrer">View GitHub releases</a></p>}
    </section>
  )
}
