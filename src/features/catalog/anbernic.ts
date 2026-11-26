/** Curated starter catalog; dates are approximate release months, not purchase dates.
 * Sources and known disagreements: docs/CATALOG.md. */
export type HardwareSpecs = { cpu: string; gpu: string; ram: string; display: string; battery: string; connectivity: string; stockOs: string; source: string }
export type CatalogModel = { model: string; released?: string; specs?: HardwareSpecs }
export const anbernicModels: CatalogModel[] = [
  { model: 'RG280M', released: '2020-06' }, { model: 'RG280V', released: '2020-11' },
  { model: 'RG300', released: '2019-06' }, { model: 'RG300X', released: '2021-07' },
  { model: 'RG350', released: '2019-09' }, { model: 'RG350M', released: '2020-03' }, { model: 'RG350P', released: '2020-07' },
  { model: 'RG351M', released: '2021-01' }, { model: 'RG351MP', released: '2021-09' }, { model: 'RG351P', released: '2020-09' }, { model: 'RG351V', released: '2021-03' },
  { model: 'RG353M', released: '2022-11' }, { model: 'RG353P', released: '2022-06' }, { model: 'RG353PS', released: '2023-05' }, { model: 'RG353V', released: '2022-09' }, { model: 'RG353VS', released: '2022-09' },
  { model: 'RG35XX' }, { model: 'RG35XX 2024', released: '2024-03' }, { model: 'RG35XX Plus', released: '2023-11' }, { model: 'RG35XX H', released: '2024-01' }, { model: 'RG35XXSP', released: '2024-05', specs: { cpu: 'H700, quad-core Cortex-A53 up to 1.5 GHz', gpu: 'Mali-G31 MP2', ram: '1 GB', display: '3.5-inch IPS, 640 × 480', battery: '3,300 mAh', connectivity: 'Wi-Fi 2.4 / 5 GHz; Bluetooth 4.2 (controllers)', stockOs: '64-bit Linux', source: 'https://anbernic.com/products/rg35xxsp' } }, { model: 'RG35XX Pro', released: '2025-06' },
  { model: 'RG28XX', released: '2024-04' }, { model: 'RG34XX', released: '2024-12', specs: { cpu: 'H700, quad-core Cortex-A53 up to 1.5 GHz', gpu: 'G31 MP2', ram: '1 GB', display: '3.4-inch IPS, 720 × 480', battery: '3,500 mAh', connectivity: 'Wi-Fi 2.4 / 5 GHz; Bluetooth 4.2', stockOs: '64-bit Linux', source: 'https://jp.anbernic.com/products/rg-34xx' } }, { model: 'RG34XXSP', released: '2025-05' },
  { model: 'RG40XX H', released: '2024-07' }, { model: 'RG40XX V', released: '2024-08' },
  { model: 'RG405M', released: '2023-03' }, { model: 'RG405V', released: '2023-09' }, { model: 'RG406H', released: '2024-11' }, { model: 'RG406V', released: '2024-09' },
  { model: 'RG476H', released: '2025-09' }, { model: 'RG477M', released: '2025-08' }, { model: 'RG477V', released: '2025-12' },
  { model: 'RG503', released: '2022-04' }, { model: 'RG505', released: '2022-11' }, { model: 'RG552', released: '2021-12' }, { model: 'RG556', released: '2024-03' }, { model: 'RG557', released: '2025-04' },
  { model: 'RG ARC-D', released: '2023-11' }, { model: 'RG ARC-S', released: '2023-11' }, { model: 'RG Cube', released: '2024-06' }, { model: 'RG CubeXX', released: '2024-10' },
  { model: 'RG DS', released: '2025-12' }, { model: 'RG DS Plus', released: '2026-09', specs: { cpu: 'RK3568, quad-core Cortex-A55 up to 2.0 GHz', gpu: 'ARM G52 2EE', ram: '1 GB', display: 'Two 4.3-inch IPS screens, 1024 × 768 each', battery: '4,000 mAh', connectivity: 'Wi-Fi 2.4 / 5 GHz; Bluetooth 4.2', stockOs: 'Linux', source: 'https://anbernic.com/products/rg-ds-plus' } }, { model: 'RG Nano', released: '2023-06' }, { model: 'RG Slide', released: '2025-06' }, { model: 'Win600', released: '2022-07' },
]
export function findAnbernicModel(manufacturer: string, model: string): CatalogModel | undefined {
  return manufacturer.trim().toLowerCase() === 'anbernic' ? anbernicModels.find(item => item.model.toLowerCase() === model.trim().toLowerCase()) : undefined
}
export function releaseLabel(month: string): string {
  const [year, number] = month.split('-').map(Number)
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, number - 1, 1)))
}
