import type { CollectionConfig } from 'payload'

import { admins, adminsField, adminsOrSelf, anyone, isAdmin } from '@/access'
import type { User } from '@/payload-types'

/**
 * Users double as authors. Two roles:
 *  - admin  — the site owner. Full control, manages users, can publish anything.
 *  - author — a contributing writer. Can create and edit their own posts.
 *             Whether authors may publish directly is controlled in Site Settings.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7, // 7 days
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000, // 10 minutes
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Admin',
  },
  access: {
    // Public read so author bylines populate on the site; email is hidden at field level below.
    read: anyone,
    create: admins,
    update: adminsOrSelf,
    delete: admins,
    admin: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      access: {
        // Only admins and the user themselves can read an email address.
        read: ({ req: { user }, doc }) => isAdmin(user as User) || user?.id === doc?.id,
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'author',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Author', value: 'author' },
      ],
      access: {
        create: adminsField,
        update: adminsField,
      },
      admin: {
        position: 'sidebar',
        description: 'Admins manage the site and users. Authors write and edit their own posts.',
      },
    },
    {
      name: 'bio',
      type: 'textarea',
      maxLength: 400,
      admin: { description: 'Shown on article bylines and the author page.' },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'instagram',
      type: 'text',
      admin: { placeholder: '@handle' },
    },
  ],
}
