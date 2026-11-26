import { describe, expect, it } from 'vitest'
import { getFormFactor } from '../src/features/catalog/formFactor'

describe('handheld illustration', () => {
  it('distinguishes known Anbernic form factors and leaves unknown devices generic', () => {
    expect(getFormFactor('Anbernic', 'RG DS Plus')).toBe('clamshell')
    expect(getFormFactor('Anbernic', 'RG35XX')).toBe('vertical')
    expect(getFormFactor('Anbernic', 'RG35XX H')).toBe('horizontal')
    expect(getFormFactor('Other', 'RG35XX')).toBe('unknown')
  })
})
