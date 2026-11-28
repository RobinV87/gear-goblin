const repository = 'RobinV87/gear-goblin'
const api = `https://api.github.com/repos/${repository}/actions`
const downloadName = 'Gear-Goblin-Android'
export const androidBuildsPage = `https://github.com/${repository}/actions/workflows/android.yml`

interface WorkflowRun {
  id: number
  run_number: number
}

interface Artifact {
  id: number
  name: string
  expired: boolean
}

async function readGitHub<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(10_000),
  })

  if (response.status === 403 || response.status === 429) {
    throw new Error('GitHub is limiting requests. Wait a moment and try again.')
  }
  if (!response.ok) throw new Error('GitHub could not provide Android build information.')
  return response.json() as Promise<T>
}

export async function findAndroidBuild() {
  const { workflow_runs } = await readGitHub<{ workflow_runs: WorkflowRun[] }>(
    `${api}/workflows/android.yml/runs?branch=main&status=success&per_page=1`,
  )
  const run = workflow_runs[0]
  if (!run) return null
  if (!Number.isSafeInteger(run.id) || !Number.isSafeInteger(run.run_number) || run.id < 1 || run.run_number < 1) {
    throw new Error('GitHub returned invalid build information.')
  }

  const { artifacts } = await readGitHub<{ artifacts: Artifact[] }>(
    `${api}/runs/${run.id}/artifacts?name=${downloadName}`,
  )
  const artifact = artifacts.find(item => item.name === downloadName && item.expired === false)
  if (!artifact) return null
  if (!Number.isSafeInteger(artifact.id) || artifact.id < 1) {
    throw new Error('GitHub returned invalid download information.')
  }
  return {
    build: run.run_number + 1,
    url: `https://github.com/${repository}/actions/runs/${run.id}/artifacts/${artifact.id}`,
  }
}
