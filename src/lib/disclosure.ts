import type { Post } from '@/payload-types'

/** Short label for cards, e.g. "Ad" — null when the post needs no disclosure. */
export const disclosureLabel = (post: Pick<Post, 'disclosure'>): string | null => {
  switch (post.disclosure) {
    case 'ad':
    case 'affiliate':
      return 'Ad'
    case 'gifted':
      return 'Gifted'
    default:
      return null
  }
}

/** Full sentence shown at the top of the article. */
export const disclosureText = (
  post: Pick<Post, 'disclosure' | 'disclosurePartner'>,
): string | null => {
  const brand = post.disclosurePartner?.trim()
  switch (post.disclosure) {
    case 'ad':
      return brand ? `Paid partnership with ${brand}.` : 'Paid partnership.'
    case 'affiliate':
      return 'This article contains affiliate links. If you buy through them we may earn a commission, at no extra cost to you.'
    case 'gifted':
      return `${brand ? `Products were gifted by ${brand}` : 'Products were gifted'}. The brand had no control over this article and all opinions are our own.`
    default:
      return null
  }
}
