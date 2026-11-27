import { ExternalLink } from 'lucide-react'

const anbernicUpdates = ['Official Anbernic firmware listings', 'https://anbernic.com/pages/system-update'] as const
const rg35xxFamily = ['Retro Game Corps family setup guide', 'https://retrogamecorps.com/2024/06/07/anbernic-rg35xx-family-starter-guide/'] as const
const rg35xxModels = new Set(['rg35xx2024', 'rg35xxplus', 'rg35xxh', 'rg35xxsp', 'rg28xx', 'rg40xxh', 'rg40xxv', 'rgcubexx'])
const originalRg35xx = [
  ['Retro Game Corps original RG35XX setup guide', 'https://retrogamecorps.com/2023/01/03/anbernic-rg35xx-starter-guide/'],
  ['Official RG35XX support', 'https://support.anbernic.com/support/solutions/articles/150000043090'],
] as const
const onion = [
  ['Onion installation guide', 'https://onionui.github.io/docs/installation'],
  ['Official Onion releases', 'https://github.com/OnionUI/Onion/releases'],
] as const

function linksFor(manufacturer: string, model: string): readonly (readonly [string, string])[] {
  const name = model.toLowerCase().replace(/[\s-]+/g, '').replace(/\+$/, 'plus')
  switch (manufacturer.trim().toLowerCase()) {
    case 'anbernic':
      if (name === 'rg35xxoriginal') return originalRg35xx
      if (name === 'rg35xx') return [
        ['Original RG35XX setup guide', originalRg35xx[0][1]],
        ['RG35XX 2024 family setup guide', rg35xxFamily[1]],
        anbernicUpdates,
      ]
      if (rg35xxModels.has(name)) return [rg35xxFamily, anbernicUpdates]
      if (['rgds', 'rgdsplus', 'rg34xx', 'rg34xxsp'].includes(name)) return [anbernicUpdates]
      return []
    case 'miyoo':
      return ['miyoomini', 'miyoominiplus', 'mini', 'miniplus'].includes(name) ? onion : []
    default:
      return []
  }
}

export function ModelGuides({ manufacturer, model }: { manufacturer: string; model: string }) {
  const links = linksFor(manufacturer, model)
  if (!links.length) return null

  return (
    <section className="workshop-panel model-guides">
      <h3>Firmware &amp; setup guides</h3>
      {manufacturer.trim().toLowerCase() === 'anbernic' && /^rg[\s-]*35xx$/i.test(model.trim()) &&
        <p>Check whether your device is the original or 2024 revision before choosing a guide.</p>}
      <ul>
        {links.map(([label, url]) => <li key={url}>
          <a href={url} target="_blank" rel="noreferrer">{label} <ExternalLink size={13} aria-hidden="true" /></a>
        </li>)}
      </ul>
    </section>
  )
}
