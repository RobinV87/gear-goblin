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
