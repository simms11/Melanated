import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@payload-config'

/**
 * Enables draft mode for signed-in CMS users so they can preview unpublished posts.
 * GET /api/preview?path=/beauty/my-post
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path') ?? '/'
  // Must be a same-origin path: "//evil.com" and "/\evil.com" are protocol-relative redirects.
  if (!/^\/(?![/\\])/.test(path)) return new Response('Invalid path', { status: 400 })

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return new Response('Unauthorised', { status: 401 })

  const draft = await draftMode()
  draft.enable()
  redirect(path)
}
