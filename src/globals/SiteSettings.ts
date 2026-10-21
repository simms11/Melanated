import type { GlobalConfig } from 'payload'

import { admins, anyone } from '@/access'
import { revalidateSettings } from '@/hooks/revalidate'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: { group: 'Admin' },
  access: {
    read: anyone,
    update: admins,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Brand',
          fields: [
            {
              name: 'siteName',
              type: 'text',
              required: true,
              defaultValue: 'Melanated Online',
            },
            {
              name: 'tagline',
              type: 'text',
              defaultValue: 'The Modern Black Woman Builds',
            },
            {
              name: 'description',
              type: 'textarea',
              maxLength: 160,
              defaultValue:
                'A luxury lifestyle and empowerment platform for Black women building beautiful lives, pursuing personal growth and creating successful businesses.',
              admin: { description: 'Default meta description. Max 160 characters.' },
            },
            { name: 'logo', type: 'upload', relationTo: 'media' },
            { name: 'ogImage', type: 'upload', relationTo: 'media', label: 'Default share image' },
          ],
        },
        {
          label: 'Contact & Social',
          fields: [
            {
              name: 'contactEmail',
              type: 'email',
              defaultValue: 'Hello@Melanatedonline.com',
            },
            {
              name: 'whatsappUrl',
              type: 'text',
              label: 'WhatsApp community link',
              admin: { placeholder: 'https://chat.whatsapp.com/...' },
            },
            {
              name: 'social',
              type: 'group',
              fields: [
                {
                  name: 'instagram',
                  type: 'text',
                  admin: { placeholder: 'https://instagram.com/...' },
                },
                { name: 'tiktok', type: 'text' },
                { name: 'pinterest', type: 'text' },
                { name: 'youtube', type: 'text' },
                { name: 'x', type: 'text', label: 'X (Twitter)' },
              ],
            },
          ],
        },
        {
          label: 'Editorial',
          fields: [
            {
              name: 'editorial',
              type: 'group',
              fields: [
                {
                  name: 'authorsCanPublish',
                  type: 'checkbox',
                  defaultValue: false,
                  label: 'Authors can publish without review',
                  admin: {
                    description:
                      'Off: authors save drafts and an admin publishes. On: authors can publish their own posts directly.',
                  },
                },
                {
                  name: 'postsPerPage',
                  type: 'number',
                  defaultValue: 12,
                  min: 6,
                  max: 48,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateSettings],
  },
}
