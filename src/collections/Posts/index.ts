import type { CollectionConfig } from 'payload'

import {
  BlockquoteFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
  LinkFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'

import {
  admins,
  adminsField,
  adminsOrOwnPosts,
  authenticated,
  authenticatedOrPublished,
} from '@/access'
import { slugField } from '@/fields/slug'
import { recordPostRedirect } from '@/hooks/redirects'
import { revalidatePost, revalidatePostDelete } from '@/hooks/revalidate'
import type { Post } from '@/payload-types'

import { computeReadTime } from './hooks/computeReadTime'
import { enforcePublishPermission } from './hooks/enforcePublishPermission'
import { ensureAuthorIsListed } from './hooks/ensureAuthorIsListed'
import { populatePublishedAt } from './hooks/populatePublishedAt'
import { postPath } from './postPath'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'authors', '_status', 'publishedAt'],
    group: 'Content',
    // Hidden until the post has a slug and category — anything else would 404.
    preview: async (doc, { req }) => {
      const path = await postPath(req.payload, doc as Pick<Post, 'slug' | 'category'>, req)
      if (!path) return null
      return `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}/api/preview?path=${encodeURIComponent(path)}`
    },
  },
  access: {
    read: authenticatedOrPublished,
    create: authenticated,
    update: adminsOrOwnPosts,
    delete: admins,
  },
  defaultPopulate: {
    title: true,
    slug: true,
    excerpt: true,
    category: true,
    heroImage: true,
    publishedAt: true,
    readTime: true,
  },
  defaultSort: '-publishedAt',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 120,
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'excerpt',
              type: 'textarea',
              required: true,
              maxLength: 220,
              admin: {
                description:
                  'One or two sentences shown on cards and in search results. Keep it under 220 characters.',
              },
            },
            {
              name: 'heroImage',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            {
              name: 'content',
              type: 'richText',
              required: true,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => [
                  ...rootFeatures,
                  HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
                  BlockquoteFeature(),
                  LinkFeature({ enabledCollections: ['posts'] }),
                  UploadFeature({ collections: { media: { fields: [] } } }),
                  HorizontalRuleFeature(),
                  FixedToolbarFeature(),
                  InlineToolbarFeature(),
                ],
              }),
            },
          ],
        },
        {
          label: 'SEO',
          name: 'meta',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({ hasGenerateFn: true }),
            MetaDescriptionField({ hasGenerateFn: true }),
            MetaImageField({ relationTo: 'media', hasGenerateFn: true }),
            PreviewField({
              hasGenerateFn: true,
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    // ---- Sidebar ----
    slugField('title'),
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'authors',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      required: true,
      admin: { position: 'sidebar' },
      defaultValue: ({ user }) => (user ? [user.id] : undefined),
    },
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
      admin: { position: 'sidebar', description: 'Free-form tags, e.g. "skincare", "autumn".' },
    },
    {
      name: 'disclosure',
      type: 'select',
      required: true,
      defaultValue: 'none',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Ad — paid partnership', value: 'ad' },
        { label: 'Ad — contains affiliate links', value: 'affiliate' },
        { label: 'Gifted — free product, no brand control', value: 'gifted' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'UK advertising rules (ASA/CMA): paid or affiliate content must be labelled "Ad" before the reader engages. Shown at the top of the article and on cards.',
      },
    },
    {
      name: 'disclosurePartner',
      type: 'text',
      label: 'Brand',
      admin: {
        position: 'sidebar',
        condition: (data) => data?.disclosure === 'ad' || data?.disclosure === 'gifted',
        description: 'The brand you partnered with or that sent the product.',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Set automatically on first publish. Edit to backdate.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      access: { update: adminsField },
      admin: {
        position: 'sidebar',
        description: 'Show as the large featured story on the home page.',
      },
    },
    {
      name: 'trending',
      type: 'checkbox',
      defaultValue: false,
      access: { update: adminsField },
      admin: { position: 'sidebar', description: 'Pin in the "Trending Now" list.' },
    },
    {
      name: 'readTime',
      type: 'number',
      admin: { position: 'sidebar', readOnly: true, description: 'Minutes. Calculated on save.' },
    },
    {
      name: 'relatedPosts',
      type: 'relationship',
      relationTo: 'posts',
      hasMany: true,
      admin: { position: 'sidebar' },
      filterOptions: ({ id }) => ({ id: { not_in: [id] } }),
    },
  ],
  hooks: {
    beforeValidate: [ensureAuthorIsListed, enforcePublishPermission],
    beforeChange: [populatePublishedAt, computeReadTime],
    afterChange: [revalidatePost, recordPostRedirect],
    afterDelete: [revalidatePostDelete],
  },
  versions: {
    drafts: {
      autosave: { interval: 2000 },
      schedulePublish: true,
    },
    maxPerDoc: 30,
  },
}
