import type { CollectionBeforeValidateHook } from 'payload'

import { isAdmin } from '@/access'
import type { User } from '@/payload-types'

/**
 * A non-admin author must always be listed on their own post, otherwise they
 * would lose the ability to edit it (update access is "own posts only").
 */
export const ensureAuthorIsListed: CollectionBeforeValidateHook = ({ data, req }) => {
  const user = req.user as User | null
  if (!user || isAdmin(user) || !data) return data
  const ids = (data.authors ?? []).map((a: User | number) => (typeof a === 'object' ? a.id : a))
  if (!ids.includes(user.id)) data.authors = [...ids, user.id]
  return data
}
