import {
  BlockquoteFeature,
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
  LinkFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'

import { GalleryBlock } from '@/blocks/Gallery'

/** The rich-text editor for posts and pages: headings, quotes, lists, links, images, galleries. */
export const editorialEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
    BlockquoteFeature(),
    LinkFeature({ enabledCollections: ['posts', 'pages'] }),
    UploadFeature({ collections: { media: { fields: [] } } }),
    BlocksFeature({ blocks: [GalleryBlock] }),
    HorizontalRuleFeature(),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})
