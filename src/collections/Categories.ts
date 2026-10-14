import type { CollectionConfig } from 'payload'

import { admins, anyone } from '@/access'
import { slugField } from '@/fields/slug'
import { revalidateAll } from '@/hooks/revalidate'

/**
 * The five editorial sections: Fashion, Beauty, Wellness, Business, Community.
 * Seeded on first run; admins can tweak copy and imagery but the set is meant to stay small.
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'order'],
    group: 'Content',
  },
  access: {
    read: anyone,
    create: admins,
    update: admins,
    delete: admins,
  },
  defaultSort: 'order',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField('title'),
    {
      name: 'tagline',
      type: 'text',
      maxLength: 90,
      admin: {
        description: 'One line under the category name, e.g. "Timeless style. Bold looks."',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      maxLength: 300,
      admin: { description: 'Intro paragraph on the category landing page.' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Tile image on the home page and hero on the category page.' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      admin: { position: 'sidebar', description: 'Lower numbers appear first in navigation.' },
    },
  ],
  hooks: {
    afterChange: [revalidateAll],
    afterDelete: [revalidateAll],
  },
}
