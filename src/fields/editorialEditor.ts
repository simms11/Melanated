import {
  BlockquoteFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
  LinkFeature,
  UploadFeature,
} from '@payloadcms/richtext-lexical'

/** The rich-text editor for posts and pages: headings, quotes, lists, links, inline images. */
export const editorialEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
    BlockquoteFeature(),
    LinkFeature({ enabledCollections: ['posts', 'pages'] }),
    UploadFeature({ collections: { media: { fields: [] } } }),
    HorizontalRuleFeature(),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})
