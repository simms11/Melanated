import type { CollectionBeforeDeleteHook } from 'payload'

/**
 * reactions.post is required, and Payload's foreign key is ON DELETE SET NULL, so Postgres
 * refused to delete any post that had hearts. Remove its counts first, in the same
 * transaction, so deleting a post always works and leaves no orphaned counts.
 */
export const removeReactions: CollectionBeforeDeleteHook = async ({ id, req }) => {
  await req.payload.delete({
    collection: 'reactions',
    where: { post: { equals: id } },
    overrideAccess: true,
    req,
  })
}
