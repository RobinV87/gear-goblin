import { describe, expect, it } from 'vitest'
import { anbernicModels, findAnbernicModel } from '../src/features/catalog/anbernic'

describe('Anbernic catalog', () => {
  it('looks up a known model without conflating its 2024 revision', () => {
    expect(findAnbernicModel('anbernic', 'RG35XX')?.released).toBeUndefined()
    expect(findAnbernicModel('Anbernic', 'RG35XX 2024')?.released).toBe('2024-03')
    expect(findAnbernicModel('Other', 'RG35XX')).toBeUndefined()
  })
  it('has unique names and valid month-formatted release dates', () => {
    expect(new Set(anbernicModels.map(item => item.model.toLowerCase())).size).toBe(anbernicModels.length)
    for (const item of anbernicModels) if (item.released) expect(item.released).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/)
  })
})

describe('catalog hardware data', () => {
  it('provides sourced specifications for known models and keeps disputed models unverified', () => {
    expect(findAnbernicModel('Anbernic', 'RG DS Plus')?.specs?.ram).toBe('1 GB')
    expect(findAnbernicModel('Anbernic', 'RG353V')?.specs?.ram).toBe('2 GB')
    expect(findAnbernicModel('Anbernic', 'RG353VS')?.specs?.ram).toBe('1 GB')
    expect(findAnbernicModel('Anbernic', 'RG35XX')?.specs?.ram).toBe('256 MB DDR3')
    expect(findAnbernicModel('Anbernic', 'RG300')?.specs?.ram).toBe('128 MB DDR2')
    for (const model of anbernicModels) {
      const specs = findAnbernicModel('Anbernic', model.model)?.specs
      if (specs) expect(new URL(specs.source).protocol).toBe('https:')
    }
  })
})
