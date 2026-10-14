import { describe, expect, it } from 'vitest'

import { toSlug } from '@/fields/slug'

describe('toSlug', () => {
  it('lowercases, strips accents and collapses punctuation', () => {
    expect(toSlug('The Best Skincare Routine, for Glowing Skin!')).toBe(
      'the-best-skincare-routine-for-glowing-skin',
    )
    expect(toSlug('Café Société — Été')).toBe('cafe-societe-ete')
    expect(toSlug('  --leading & trailing--  ')).toBe('leading-trailing')
  })
})
