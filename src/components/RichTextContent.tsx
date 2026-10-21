import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { type JSXConvertersFunction, RichText } from '@payloadcms/richtext-lexical/react'

import type { GalleryBlock } from '@/payload-types'

import { Gallery } from './Gallery'

/** Post and page body: Payload's rich text, plus the site's own blocks. */
const converters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  blocks: {
    gallery: ({ node }: { node: { fields: GalleryBlock } }) => <Gallery {...node.fields} />,
  },
})

export function RichTextContent({ data }: { data: SerializedEditorState }) {
  return <RichText data={data} converters={converters} />
}
