import type {
  CollectionBeforeDeleteHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
} from 'payload'
import { APIError, ValidationError } from 'payload'

import { admins, anyone } from '@/access'
import { slugField } from '@/fields/slug'
import { uniqueTopLevelSlug } from '@/fields/topLevelSlug'
import { recordCategoryRedirect } from '@/hooks/redirects'
import { revalidateAll } from '@/hooks/revalidate'

/**
 * The editorial sections (Fashion, Beauty, Wellness, Business). Community is a page, not a category.
 * Seeded on first run; admins can tweak copy and imagery but the set is meant to stay small.
 */

/**
 * The slug is in every post URL under the category. Once published posts use it, it's locked:
 * rename the category freely (the title is the display name), but the address stays put.
 */
const lockSlugWhenInUse: CollectionBeforeValidateHook = async ({
  data,
  originalDoc,
  operation,
  req,
}) => {
  if (operation !== 'update' || !originalDoc?.slug || !data?.slug) return data
  if (data.slug === originalDoc.slug) return data
  const { totalDocs } = await req.payload.count({
    collection: 'posts',
    where: {
      and: [{ category: { equals: originalDoc.id } }, { _status: { equals: 'published' } }],
    },
    req,
  })
  if (totalDocs > 0) {
    throw new ValidationError({
      collection: 'categories',
      errors: [
        {
          path: 'slug',
          message: `This address is used by ${totalDocs} published ${totalDocs === 1 ? 'post' : 'posts'} and can't change. Edit the title to rename the section.`,
        },
      ],
      req,
    })
  }
  return data
}

/**
 * posts.category is ON DELETE SET NULL, so deleting a section would silently strip it from
 * its posts (drafts included) and break their URLs. Make the editor move them first.
 */
const refuseDeleteWhilePostsExist: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const { totalDocs } = await req.payload.count({
    collection: 'posts',
    where: { category: { equals: id } },
    req,
  })
  if (totalDocs > 0) {
    throw new APIError(
      `This section still has ${totalDocs} ${totalDocs === 1 ? 'post' : 'posts'} (drafts included). Move ${totalDocs === 1 ? 'it' : 'them'} to another section before deleting it.`,
      400,
      undefined,
      true,
    )
  }
}

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
      admin: {
        description: 'Display name in navigation and headings. Safe to change at any time.',
      },
    },
    slugField(
      'title',
      'The web address, e.g. /business. Locked once the section has published posts.',
    ),
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
    beforeValidate: [lockSlugWhenInUse, uniqueTopLevelSlug('categories')],
    beforeDelete: [refuseDeleteWhilePostsExist],
    afterChange: [revalidateAll, recordCategoryRedirect],
    afterDelete: [revalidateAll],
  },
}
