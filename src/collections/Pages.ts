import type { CollectionConfig } from 'payload'

import { admins, adminsOrPublished } from '@/access'
import { editorialEditor } from '@/fields/editorialEditor'
import { slugField } from '@/fields/slug'
import { uniqueTopLevelSlug } from '@/fields/topLevelSlug'
import { revalidatePage } from '@/hooks/revalidate'

/**
 * Standalone pages: privacy, terms, about and anything similar. Admins write them in the same
 * editor as posts; the layout stays in code so the design can't be broken. Drafts let a
 * policy change be prepared and reviewed before it goes live.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    group: 'Content',
    description: 'Standalone pages such as the privacy policy and terms. Admins only.',
    preview: (doc) =>
      doc?.slug
        ? `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}/api/preview?path=${encodeURIComponent(`/${doc.slug}`)}`
        : null,
  },
  access: {
    read: adminsOrPublished,
    create: admins,
    update: admins,
    delete: admins,
  },
  versions: { drafts: true, maxPerDoc: 30 },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title', 'The web address, e.g. /privacy. Must not match a section.'),
    {
      name: 'intro',
      type: 'textarea',
      maxLength: 300,
      admin: { description: 'Optional short summary shown under the title.' },
    },
    { name: 'content', type: 'richText', required: true, editor: editorialEditor },
    {
      name: 'lastUpdated',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
        description: 'Shown as "Last updated". Change it when the content changes materially.',
      },
    },
    {
      name: 'showInFooter',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Link to this page from the footer (once published).',
      },
    },
  ],
  hooks: {
    beforeValidate: [uniqueTopLevelSlug('pages')],
    afterChange: [revalidatePage],
    afterDelete: [revalidatePage],
  },
}
