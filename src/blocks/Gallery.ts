import type { Block } from 'payload'

/** A set of photos shown together as a grid inside an article or page. */
export const GalleryBlock: Block = {
  slug: 'gallery',
  interfaceName: 'GalleryBlock',
  labels: { singular: 'Gallery', plural: 'Galleries' },
  fields: [
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      minRows: 2,
      maxRows: 12,
      admin: {
        description: '2 to 12 photos. Each keeps the alt text and credit set on the image.',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: { description: 'Optional, shown under the gallery.' },
    },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '2',
      required: true,
      options: [
        { label: '2 across', value: '2' },
        { label: '3 across', value: '3' },
      ],
      admin: { description: 'On phones, galleries always show 2 across.' },
    },
  ],
}
