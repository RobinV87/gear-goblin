import { anbernicModels, getAnbernicSpecs } from './anbernicModels'
import { retroCatalogModels } from './retroCatalogModels'

const normalize = (value: string) => value.toLowerCase().replace(/[\s-]+/g, '')
const modelsByManufacturer = new Map<string, string[]>([['anbernic', [...anbernicModels]]])
const manufacturers = new Set(['Anbernic'])
type CatalogSpecs = Record<'display' | 'cpu' | 'gpu' | 'ram' | 'storage' | 'system' | 'battery' | 'wireless', string | null> & { source: string }
const specsByModel = new Map<string, CatalogSpecs>()

for (const [manufacturer, model, slug, display, cpu, gpu, ram, storage, system, battery, wireless] of retroCatalogModels) {
  const brand = normalize(manufacturer)
  manufacturers.add(manufacturer)
  const models = modelsByManufacturer.get(brand) ?? []
  models.push(model)
  modelsByManufacturer.set(brand, models)
  specsByModel.set(`${brand}/${normalize(model)}`, {
    display, cpu, gpu, ram, storage, system, battery, wireless,
    source: `https://retrocatalog.com/retro-handhelds/${slug}`,
  })
}

for (const models of modelsByManufacturer.values()) {
  models.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
}

export const handheldManufacturers = [...manufacturers].sort((a, b) => a.localeCompare(b, 'en'))

export function getHandheldModels(manufacturer: string) {
  return modelsByManufacturer.get(normalize(manufacturer))
}

export function getHandheldSpecs(manufacturer: string, model: string) {
  return getAnbernicSpecs(manufacturer, model.replace(/-/g, ''))
    ?? specsByModel.get(`${normalize(manufacturer)}/${normalize(model)}`)
}
