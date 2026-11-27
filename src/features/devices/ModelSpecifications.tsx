import { getHandheldSpecs } from './handheldCatalog'
import type { DeviceInput } from './model'

type ModelSpecificationsProps = Pick<DeviceInput, 'manufacturer' | 'model'> & { expanded?: boolean }

export function ModelSpecifications({ manufacturer, model, expanded }: ModelSpecificationsProps) {
  const specs = getHandheldSpecs(manufacturer, model)
  if (!specs) {
    return expanded ? <section><h3>Model specs</h3><p>Specs are unavailable for this model.</p></section> : null
  }

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

  const content = (
    <>
      <dl>
        {rows.filter(([, value]) => value).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <a href={specs.source} target="_blank" rel="noreferrer">Specification source</a>
    </>
  )

  return expanded ? (
    <section className="model-specifications specifications-panel">
      <h3>Model specs</h3>
      {content}
    </section>
  ) : (
    <details className="model-specifications">
      <summary>Model specs</summary>
      {content}
    </details>
  )
}
