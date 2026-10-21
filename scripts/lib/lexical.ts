/**
 * Turns simple text into Payload's rich-text (Lexical) format, for seeding editable pages.
 * Supports "## " and "### " headings, "- " bullet lists, **bold**, and blank-line paragraphs.
 */
type Node = Record<string, unknown>

const base = { version: 1, format: '', indent: 0, direction: 'ltr' as const }

const inline = (text: string): Node[] =>
  text
    .split(/(\*\*[^*]+\*\*)/)
    .filter(Boolean)
    .map((part) => ({
      type: 'text',
      version: 1,
      text: part.startsWith('**') ? part.slice(2, -2) : part,
      format: part.startsWith('**') ? 1 : 0,
      style: '',
      mode: 'normal',
      detail: 0,
    }))

export const toLexical = (source: string) => {
  const children: Node[] = []
  const blocks = source.trim().split(/\n\s*\n/)
  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim())
    const heading = lines[0].match(/^(#{2,3}) (.*)$/)
    if (heading) {
      children.push({
        ...base,
        type: 'heading',
        tag: heading[1] === '##' ? 'h2' : 'h3',
        children: inline(heading[2]),
      })
    } else if (lines.every((l) => l.startsWith('- '))) {
      children.push({
        ...base,
        type: 'list',
        listType: 'bullet',
        tag: 'ul',
        start: 1,
        children: lines.map((l, i) => ({
          ...base,
          type: 'listitem',
          value: i + 1,
          children: inline(l.slice(2)),
        })),
      })
    } else {
      children.push({
        ...base,
        type: 'paragraph',
        textFormat: 0,
        children: inline(lines.join(' ')),
      })
    }
  }
  return { root: { ...base, type: 'root', children } }
}
