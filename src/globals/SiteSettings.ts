import type { Field, GlobalConfig, TextFieldSingleValidation } from 'payload'

import { admins, anyone } from '@/access'
import { revalidateSettings } from '@/hooks/revalidate'

/** Social links must be full addresses: "@handle" would become a broken link in the footer. */
const httpsUrl: TextFieldSingleValidation = (value) =>
  !value || /^https:\/\/[^\s/$.?#].[^\s]*$/i.test(value)
    ? true
    : 'Use the full address, starting with https:// (for example https://instagram.com/yourname).'

const socialLink = (name: string, label: string, placeholder: string): Field => ({
  name,
  type: 'text',
  label,
  validate: httpsUrl,
  admin: { placeholder },
})

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
              name: 'social',
              type: 'group',
              fields: [
                socialLink('instagram', 'Instagram', 'https://instagram.com/...'),
                socialLink('tiktok', 'TikTok', 'https://www.tiktok.com/@...'),
                socialLink('pinterest', 'Pinterest', 'https://pinterest.com/...'),
                socialLink('youtube', 'YouTube', 'https://youtube.com/@...'),
                socialLink('x', 'X (Twitter)', 'https://x.com/...'),
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
