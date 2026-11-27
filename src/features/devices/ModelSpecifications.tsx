import { getHandheldSpecs } from './handheldCatalog'
import type { DeviceInput } from './model'

export function ModelSpecifications({ manufacturer, model }: Pick<DeviceInput, 'manufacturer' | 'model'>) {
  const specs = getHandheldSpecs(manufacturer, model)
  if (!specs) return null

  const rows = [
    ['Display', specs.display],
    ['Processor', specs.cpu],
    ['Graphics', specs.gpu],
    ['RAM', specs.ram],
    ['Storage', specs.storage],
    ['Operating system', specs.system],
    ['Battery', specs.battery],
    ['Wireless', specs.wireless],
  ]

  return (
    <details className="model-specifications">
      <summary>Model specs</summary>
      <dl>
        {rows.filter(([, value]) => value).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <a href={specs.source} target="_blank" rel="noreferrer">Specification source</a>
    </details>
  )
}
