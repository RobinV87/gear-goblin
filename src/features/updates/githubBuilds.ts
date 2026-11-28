const repository = 'RobinV87/gear-goblin'
const api = `https://api.github.com/repos/${repository}/releases`
const releasesPage = `https://github.com/${repository}/releases`
const apkName = 'Gear-Goblin-Android.apk'

export const androidBuildsPage = releasesPage

interface GitHubRelease {
  tag_name: string
  draft: boolean
  prerelease: boolean
  assets: { name: string; state: string; size: number }[]
}

export async function findAndroidBuild() {
  const response = await fetch(`${api}?per_page=30`, {
    cache: 'no-store',
    headers: { Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(10_000),
  })
  if (response.status === 403 || response.status === 429) {
    throw new Error('GitHub is limiting requests. Wait a moment and try again.')
  }
  if (!response.ok) throw new Error('GitHub could not provide Android build information.')

  const releases: GitHubRelease[] = await response.json()
  const builds = releases.flatMap(release => {
    if (release.draft || !release.prerelease) return []
    const match = /^android-build-([1-9]\d*)$/.exec(release.tag_name)
    const build = Number(match?.[1])
    if (!Number.isSafeInteger(build) || build > 2_100_000_000 ||
        !release.assets.some(asset => asset.name === apkName && asset.state === 'uploaded' && asset.size > 0)) return []

    return [{
      build,
      url: `${releasesPage}/download/${release.tag_name}/${apkName}`,
    }]
  })
  return builds.sort((a, b) => b.build - a.build)[0] ?? null
}
