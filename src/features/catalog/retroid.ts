import type { CatalogModel } from './anbernic'

// Model names and approximate dates from HandheldWiki, checked 2026-11-26.
// Specs are reference data and may vary between configurations and revisions.
const source = 'https://handheldwiki.com/brand/retroid-moorechip/'
export const retroidModels: CatalogModel[] = [
  { model: 'Pocket', released: '2020-02', specs: { source, cpu: 'MediaTek MT6580A', ram: '512 MB', display: '3.5-inch' } },
  { model: 'Pocket 2', specs: { source, cpu: 'MediaTek MT6580A', ram: '1 GB', display: '3.5-inch' } },
  { model: 'Pocket 2+', released: '2021-12', specs: { source, cpu: 'Unisoc Tiger T310', ram: '2 GB', display: '3.5-inch' } },
  { model: 'Pocket 2S', released: '2023-08', specs: { source, cpu: 'Unisoc Tiger T610', ram: '3 GB / 4 GB (configuration dependent)', display: '3.5-inch' } },
  { model: 'Pocket 3', released: '2022-08', specs: { source, cpu: 'Unisoc Tiger T310', ram: '2 GB / 3 GB (configuration dependent)', display: '4.7-inch' } },
  { model: 'Pocket 3+', released: '2022-11', specs: { source, cpu: 'Unisoc Tiger T618', ram: '4 GB', display: '4.7-inch' } },
  { model: 'Pocket Flip', released: '2023-04', specs: { source, cpu: 'Unisoc Tiger T618', ram: '4 GB', display: '4.7-inch' } },
  { model: 'Pocket 4', released: '2024-01', specs: { source, cpu: 'MediaTek Dimensity 900', ram: '4 GB', display: '4.7-inch' } },
  { model: 'Pocket 4 Pro', released: '2024-01', specs: { source, cpu: 'MediaTek Dimensity 1100', ram: '8 GB', display: '4.7-inch' } },
  { model: 'Pocket Mini', released: '2024-09', specs: { source, cpu: 'Snapdragon 865', ram: '6 GB', display: '3.7-inch' } },
  { model: 'Pocket 5', released: '2024-11', specs: { source: 'https://www.goretroid.com/collections/retro-game-system/products/retroid-pocket-5-handheld', cpu: 'Snapdragon 865', display: '5.5-inch' } },
  { model: 'Pocket Flip 2', released: '2025-04', specs: { source, cpu: 'Snapdragon 865 / Dimensity 1100 (configuration dependent)', ram: '8 GB', display: '5.5-inch' } },
  { model: 'Pocket Classic', released: '2025-04', specs: { source, cpu: 'Snapdragon G1 Gen 2', ram: '4 GB / 6 GB (configuration dependent)', display: '3.92-inch' } },
  { model: 'Pocket Mini V2', released: '2025-05', specs: { source, cpu: 'Snapdragon 865', ram: '6 GB', display: '3.92-inch' } },
  { model: 'Pocket G2', released: '2025-10', specs: { source, cpu: 'Snapdragon G2 Gen 2', ram: '8 GB', display: '5.5-inch' } },
  { model: 'Pocket 6', released: '2026-01', specs: { source: 'https://www.goretroid.com/collections/retro-game-system/products/retroid-pocket-6-handheld', cpu: 'Snapdragon 8 Gen 2', ram: '8 GB / 12 GB (configuration dependent)', display: '5.5-inch' } },
  { model: 'Pocket Nova', released: '2026-07', specs: { source, cpu: 'Qualcomm QCS8550', ram: '8 GB / 12 GB (configuration dependent)', display: '4.5-inch' } },
  { model: 'Pocket Duo', released: '2026-09', specs: { source, cpu: 'Qualcomm Q-7790', ram: '8 GB', display: '5.5-inch' } },
  { model: 'Pocket Duo Lite', released: '2026-09', specs: { source, cpu: 'Qualcomm QCS6125', ram: '4 GB / 6 GB (configuration dependent)', display: '5.5-inch' } },
]
export function findRetroidModel(manufacturer: string, model: string): CatalogModel | undefined {
  if (manufacturer.trim().toLowerCase() !== 'retroid') return undefined
  return retroidModels.find(item => item.model.toLowerCase() === model.trim().toLowerCase())
}
