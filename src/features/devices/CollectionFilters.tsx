import type { WorkshopRecord } from '../workshop/model'
import { normalizedSearch } from './collectionSearch'
import type { Device } from './model'

export function CollectionFilters({ devices, records, unavailable, search, manufacturer, firmware, onSearch, onManufacturer, onFirmware, onClear }: {
  devices: Device[]
  records: WorkshopRecord[]
  unavailable: boolean
  search: string
  manufacturer: string
  firmware: string
  onSearch: (value: string) => void
  onManufacturer: (value: string) => void
  onFirmware: (value: string) => void
  onClear: () => void
}) {
  function options(values: string[]) {
    return [...new Map(values.map(value => [normalizedSearch(value), value])).entries()]
      .sort(([, a], [, b]) => a.localeCompare(b))
      .map(([key, value]) => <option value={key} key={key}>{value}</option>)
  }

  return (
    <div className="collection-filters" role="search" aria-label="Filter handhelds">
      <div className="collection-filter-fields">
        <label>Search handhelds
          <input type="search" value={search} placeholder="Model, nickname, brand, or firmware"
            onChange={event => onSearch(event.target.value)} />
        </label>
        <label>Manufacturer
          <select aria-label="Manufacturer" value={manufacturer} onChange={event => onManufacturer(event.target.value)}>
            <option value="">All manufacturers</option>
            {options(devices.map(device => device.manufacturer))}
          </select>
        </label>
        <label>Recorded firmware
          <select aria-label="Recorded firmware" value={firmware} disabled={unavailable} onChange={event => onFirmware(event.target.value)}>
            <option value="">All firmware</option>
            {options(records.map(entry => entry.name))}
          </select>
        </label>
      </div>
      {(search || manufacturer || firmware) && <button className="secondary" onClick={onClear}>Clear filters</button>}
      {unavailable && <p className="error" role="alert">Firmware search is unavailable.</p>}
    </div>
  )
}
