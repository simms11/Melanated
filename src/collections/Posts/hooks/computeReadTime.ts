import type { CollectionBeforeChangeHook } from 'payload'

const WORDS_PER_MINUTE = 220

type LexicalNode = { text?: string; children?: LexicalNode[] }

const extractText = (node: LexicalNode | undefined): string => {
  if (!node) return ''
  const own = node.text ?? ''
  const kids = (node.children ?? []).map(extractText).join(' ')
  return `${own} ${kids}`
}

/** Estimate reading time from the Lexical content tree. */
export const computeReadTime: CollectionBeforeChangeHook = ({ data }) => {
  const root = data?.content?.root as LexicalNode | undefined
  if (!root) return data
  const words = extractText(root).trim().split(/\s+/).filter(Boolean).length
  data.readTime = Math.max(1, Math.round(words / WORDS_PER_MINUTE))
  return data
}
