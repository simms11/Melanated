import type { Field, FieldHook } from 'payload'

export const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const formatSlug =
  (fallbackField: string): FieldHook =>
  ({ value, data, operation }) => {
    if (typeof value === 'string' && value.trim()) return toSlug(value)
    if (operation === 'create' || !value) {
      const source = data?.[fallbackField]
      if (typeof source === 'string') return toSlug(source)
    }
    return value
  }

/** URL-safe slug, generated from `fallbackField` and editable in the sidebar. */
export const slugField = (
  fallbackField = 'title',
  description = 'Used in the URL. Generated from the title; edit before publishing if needed.',
): Field => ({
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description,
  },
  hooks: { beforeValidate: [formatSlug(fallbackField)] },
})
