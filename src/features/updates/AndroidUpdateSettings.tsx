import { App } from '@capacitor/app'
import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { androidBuildsPage, findAndroidBuild } from './githubBuilds'

type UpdateResult = {
  message: string
  url?: string
  error?: boolean
}

export function AndroidUpdateSettings() {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<UpdateResult>()

  async function check() {
    setBusy(true)
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
          url: available.url,
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
      setBusy(false)
    }
  }

  return (
    <section className="placeholder">
      <h2>Android updates</h2>
      <div className="backup-actions">
        <button className="secondary" disabled={busy} onClick={() => void check()}>
          <RefreshCw size={16} aria-hidden="true" /> {busy ? 'Checking GitHub…' : 'Check for updates'}
        </button>
      </div>
      {result && <p role={result.error ? 'alert' : 'status'}>{result.message}</p>}
      {result?.url && <>
        <div className="backup-actions">
          <a className="primary" href={result.url} target="_blank" rel="noreferrer">Download from GitHub</a>
        </div>
        <p>Sign in to GitHub, unzip the download, and open the APK. Export a backup before replacing a preview signed with a different key.</p>
      </>}
      {result && !result.url && <p><a href={androidBuildsPage} target="_blank" rel="noreferrer">View GitHub builds</a></p>}
    </section>
  )
}
