import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { admins, adminsOrUploader, anyone, authenticated } from '@/access'

/**
 * Who uploaded an image decides who may edit or replace it. Set here, from the signed-in
 * user, never from the request body; edits keep the original uploader.
 */
const recordUploader: CollectionBeforeChangeHook = ({ data, operation, originalDoc, req }) => {
  if (operation === 'create') data.uploadedBy = req.user?.id ?? null
  else data.uploadedBy = originalDoc?.uploadedBy ?? null
  return data
}

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
  },
  access: {
    read: anyone,
    create: authenticated,
    // Replacing a file changes every post that uses it, so authors may only edit their own.
    update: adminsOrUploader,
    delete: admins,
  },
  hooks: { beforeChange: [recordUploader] },
  upload: {
    // Local disk in dev; swapped for Vercel Blob in production via the storage plugin.
    staticDir: 'media',
    mimeTypes: ['image/*'],
    focalPoint: true,
    crop: true,
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 400, position: 'centre' },
      { name: 'card', width: 768, height: 1024, position: 'centre' },
      { name: 'feature', width: 1200, height: 800, position: 'centre' },
      { name: 'hero', width: 1920, height: 1080, position: 'centre' },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    formatOptions: { format: 'webp', options: { quality: 82 } },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description:
          'Describe the image for screen readers and search engines. Required for accessibility.',
      },
    },
    {
      name: 'caption',
      type: 'text',
    },
    {
      name: 'credit',
      type: 'text',
      admin: { description: 'Photographer or source, shown under the image where relevant.' },
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Set automatically. Authors can only edit images they uploaded.',
      },
    },
  ],
}
