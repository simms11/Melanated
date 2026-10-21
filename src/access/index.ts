import type { Access, AccessArgs, FieldAccess, Where } from 'payload'

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
 * Admins can edit any post; authors can only edit posts they are listed on, and may not
 * publish unless Site Settings allows it (ADR 0003). Payload asks this same rule, with
 * _status "published", to decide whether to show Publish and Schedule, so writers don't
 * see buttons they can't use. The enforcePublishPermission hook remains a second check.
 */
export const adminsOrOwnPosts: Access = async ({ req, data }: AccessArgs<User>) => {
  const { user } = req
  if (!user) return false
  if (isAdmin(user)) return true
  if ((data as { _status?: string } | undefined)?._status === 'published') {
    const settings = await req.payload.findGlobal({ slug: 'site-settings', depth: 0, req })
    if (!settings?.editorial?.authorsCanPublish) return false
  }
  return { authors: { contains: user.id } }
}

/**
 * Posts. Public: published only. Admins: everything. Authors: anything published, plus
 * posts they are listed on, so they can't read another writer's unpublished drafts.
 */
export const adminsOwnOrPublished: Access = ({ req: { user } }: AccessArgs<User>) => {
  if (!user) return { _status: { equals: 'published' } }
  if (isAdmin(user)) return true
  const ownOrPublished: Where = {
    or: [{ _status: { equals: 'published' } }, { authors: { contains: user.id } }],
  }
  return ownOrPublished
}

/** Media. Admins edit any image; authors only images they uploaded themselves. */
export const adminsOrUploader: Access = ({ req: { user } }: AccessArgs<User>) => {
  if (!user) return false
  if (isAdmin(user)) return true
  return { uploadedBy: { equals: user.id } }
}

/** Site content (pages). Public: published only. Admins: everything. Authors: published only. */
export const adminsOrPublished: Access = ({ req: { user } }: AccessArgs<User>) => {
  if (isAdmin(user)) return true
  const published: Where = { _status: { equals: 'published' } }
  return published
}

/**
 * Version history. Without its own rule Payload lets any signed-in user read every version,
 * which leaked other writers' drafts. Admins: all. Authors: versions of posts they're on.
 */
export const adminsOrOwnPostVersions: Access = ({ req: { user } }: AccessArgs<User>) => {
  if (!user) return false
  if (isAdmin(user)) return true
  const own: Where = { 'version.authors': { contains: user.id } }
  return own
}
