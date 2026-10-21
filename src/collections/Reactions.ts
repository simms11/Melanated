import type { CollectionConfig } from 'payload'

import { admins, authenticated } from '@/access'

/**
 * Heart counts per post. Kept out of `posts` on purpose: writing to a post creates a version
 * and revalidates the site, which would happen on every reader's click. Counts are changed
 * only by /api/posts/[id]/heart with an atomic SQL increment; the admin view is read-only.
 */
export const Reactions: CollectionConfig = {
  slug: 'reactions',
  admin: {
    group: 'Insights',
    defaultColumns: ['post', 'hearts', 'updatedAt'],
    description: 'Hearts readers have given each post. Updated from the site; read-only here.',
  },
  access: {
    read: authenticated,
    create: () => false,
    update: () => false,
    delete: admins,
  },
  defaultSort: '-hearts',
  fields: [
    {
      name: 'post',
      type: 'relationship',
      relationTo: 'posts',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'hearts',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
    },
  ],
}
