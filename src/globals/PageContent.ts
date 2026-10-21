import type { Field, GlobalConfig, TextFieldSingleValidation } from 'payload'

import { admins, anyone } from '@/access'
import { revalidateSettings } from '@/hooks/revalidate'

/**
 * Copy for the home and Community pages. Admins edit the words; the layout stays in code so
 * the design and accessibility can't be broken. Defaults are the original wording.
 */

/** Buttons may only point within the site: a path like /community or an anchor like #latest. */
const internalLink: TextFieldSingleValidation = (value) =>
  !value || /^(\/(?![/\\])[^\s]*|#[A-Za-z][\w-]*)$/.test(value)
    ? true
    : 'Use a link within this site, e.g. /community or #latest.'

const link = (name: string, defaultValue: string, label: string): Field => ({
  name,
  type: 'text',
  label,
  required: true,
  defaultValue,
  validate: internalLink,
  admin: {
    description: 'A page on this site, e.g. /community, or #latest for the latest stories.',
  },
})

const text = (name: string, defaultValue: string, label: string, textarea = false): Field =>
  textarea
    ? { name, type: 'textarea', label, required: true, defaultValue }
    : { name, type: 'text', label, required: true, defaultValue }

const features = (name: string, label: string, defaults: Array<[string, string]>): Field => ({
  name,
  type: 'array',
  label,
  maxRows: 4,
  defaultValue: defaults.map(([title, description]) => ({ title, description })),
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'text', required: true },
  ],
})

export const PageContent: GlobalConfig = {
  slug: 'page-content',
  label: 'Page content',
  admin: {
    group: 'Content',
    description: 'Words on the home and Community pages. Admins only.',
  },
  access: { read: anyone, update: admins },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Home',
          name: 'home',
          fields: [
            text('heroButtonLabel', 'Explore the latest', 'Hero button label'),
            link('heroButtonLink', '#latest', 'Hero button link'),
            text('featuredLabel', 'Featured', 'Featured label'),
            text('trendingTitle', 'Trending now', 'Trending heading'),
            text('latestEyebrow', 'New stories', 'Latest stories label'),
            text('latestTitle', 'The latest', 'Latest stories heading'),
            text('emptyTitle', 'Coming soon', 'No stories yet: heading'),
            text(
              'emptyBody',
              'Our first stories are on their way. Join the community to hear first.',
              'No stories yet: message',
              true,
            ),
            text('communityEyebrow', 'More than a magazine', 'Community block label'),
            text('communityHeading', 'A community of', 'Community block heading'),
            text('communityHighlight', 'go-getters', 'Community block highlighted word(s)'),
            text(
              'communityIntro',
              'Join a community of ambitious, creative and empowered Black women building the life they love.',
              'Community block intro',
              true,
            ),
            text('communityButtonLabel', 'Join the community', 'Community block button label'),
            link('communityButtonLink', '/community', 'Community block button link'),
            features('communityFeatures', 'Community block points', [
              ['Exclusive content', 'Inspiration, resources and tools.'],
              ['Member events', 'Virtual and in-person experiences.'],
              ['Networking', 'Connect with like-minded women.'],
              ['Business support', 'Take your vision to the next level.'],
            ]),
          ],
        },
        {
          label: 'Community page',
          name: 'community',
          fields: [
            text('eyebrow', 'Community', 'Label'),
            text('heading', 'A space to connect, collaborate and', 'Heading'),
            text('highlight', 'rise together', 'Highlighted word(s)'),
            text(
              'intro',
              'Melanated Online is more than a magazine. It’s a community of Black women building beautiful lives, pursuing personal growth and creating successful businesses.',
              'Intro',
              true,
            ),
            text('whatsappLabel', 'Join on WhatsApp', 'WhatsApp button label'),
            text(
              'whatsappPendingLabel',
              'WhatsApp link coming soon',
              'Label while there is no WhatsApp link',
            ),
            text('emailLabel', 'Email us', 'Email button label'),
            text(
              'metaDescription',
              'Connect with like-minded women, build relationships and encourage collaboration and empowerment.',
              'Search description',
              true,
            ),
            features('pillars', 'Pillars', [
              ['Exclusive content', 'Inspiration, resources and tools shared first with members.'],
              ['Member events', 'Virtual and in-person experiences throughout the year.'],
              ['Networking', 'Connect with ambitious, like-minded women.'],
              [
                'Business support',
                'Accountability and advice to take your vision to the next level.',
              ],
            ]),
          ],
        },
      ],
    },
  ],
  hooks: { afterChange: [revalidateSettings] },
}
