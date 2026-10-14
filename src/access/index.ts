import type { Access, AccessArgs, FieldAccess } from 'payload'

import type { User } from '@/payload-types'

export type Role = 'admin' | 'author'

export const isAdmin = (user: User | null | undefined): boolean => user?.role === 'admin'

/** Anyone, signed in or not. */
export const anyone: Access = () => true

/** Any signed-in user (admin or author). */
export const authenticated: Access = ({ req: { user } }: AccessArgs<User>) => Boolean(user)

/** Admins only. */
export const admins: Access = ({ req: { user } }: AccessArgs<User>) => isAdmin(user)

/** Admins only, for individual fields (e.g. role). */
export const adminsField: FieldAccess = ({ req: { user } }) => isAdmin(user as User)

/**
 * Admins can do anything; other users are limited to their own document.
 * Used on Users so an author can edit their own profile but not other accounts.
 */
export const adminsOrSelf: Access = ({ req: { user } }: AccessArgs<User>) => {
  if (!user) return false
  if (isAdmin(user)) return true
  return { id: { equals: user.id } }
}

/**
 * Admins can edit any post; authors can only edit posts they are listed on.
 */
export const adminsOrOwnPosts: Access = ({ req: { user } }: AccessArgs<User>) => {
  if (!user) return false
  if (isAdmin(user)) return true
  return { authors: { contains: user.id } }
}

/**
 * Public readers only see published docs. Signed-in users also see drafts
 * (needed for the admin UI and preview mode).
 */
export const authenticatedOrPublished: Access = ({ req: { user } }: AccessArgs<User>) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}
