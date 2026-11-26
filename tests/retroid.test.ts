import { describe, expect, it } from 'vitest'
import { findRetroidModel, retroidModels } from '../src/features/catalog/retroid'
import { getFormFactor } from '../src/features/catalog/formFactor'

describe('Retroid catalog', () => {
  it('distinguishes models, manufacturers, and form factors', () => {
    expect(findRetroidModel('Retroid', 'Pocket 4')?.specs?.cpu).toContain('900')
    expect(findRetroidModel('Retroid', 'Pocket 4 Pro')?.specs?.cpu).toContain('1100')
    expect(findRetroidModel('Anbernic', 'Pocket 4')).toBeUndefined()
    expect(getFormFactor('Retroid', 'Pocket Flip 2')).toBe('clamshell')
    expect(getFormFactor('Retroid', 'Pocket 5')).toBe('horizontal')
    expect(new Set(retroidModels.map(item => item.model.toLowerCase())).size).toBe(retroidModels.length)
  })
})
