import type { CollectionBeforeValidateHook } from 'payload'
import { Forbidden } from 'payload'

import { isAdmin } from '@/access'
import type { User } from '@/payload-types'

/**
 * Authors can always save drafts. Whether they may publish directly is a
 * Site Settings toggle so the owner can switch between "trusted writer" and
 * "submit for review" without a code change.
 */
export const enforcePublishPermission: CollectionBeforeValidateHook = async ({ data, req }) => {
  const user = req.user as User | null
  if (!user || isAdmin(user)) return data
  if (data?._status !== 'published') return data

  const settings = await req.payload.findGlobal({ slug: 'site-settings', depth: 0 })
  if (settings?.editorial?.authorsCanPublish) return data

  throw new Forbidden(req.t)
}
