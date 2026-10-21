import { postgresAdapter } from '@payloadcms/db-postgres'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'
import sharp from 'sharp'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { HeartLimits, HeartVotes } from './collections/Hearts'
import { Reactions } from './collections/Reactions'
import { postPath } from './collections/Posts/postPath'
import { Users } from './collections/Users'
import { PageContent } from './globals/PageContent'
import { SiteSettings } from './globals/SiteSettings'
import type { User } from './payload-types'
import { admins, authenticated, isAdmin } from './access'
import { shouldPushSchema } from './lib/localDatabase'
import { assertProductionEnv } from './lib/productionEnv'
import { revalidateRedirects } from './hooks/redirects'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

assertProductionEnv()

export default buildConfig({
  serverURL,
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' · Melanated Online',
    },
  },
  collections: [Posts, Pages, Categories, Media, Users, Reactions, HeartVotes, HeartLimits],
  globals: [SiteSettings, PageContent],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    // Push only a local dev database; hosted databases and production use migrations.
    push: shouldPushSchema(process.env),
  }),
  sharp,
  upload: {
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  },
  plugins: [
    // Old URLs keep working after a slug or category change. Entries are created
    // automatically by hooks on Posts and Categories; admins can also add them by hand.
    redirectsPlugin({
      collections: ['posts', 'categories'],
      overrides: {
        admin: {
          group: 'Settings',
          description:
            'Old URL → current page. Created automatically when a published URL changes.',
        },
        access: { read: authenticated, create: admins, update: admins, delete: admins },
        hooks: { afterChange: [revalidateRedirects], afterDelete: [revalidateRedirects] },
      },
    }),
    seoPlugin({
      collections: ['posts', 'pages'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }) => `${doc?.title ?? ''} · Melanated Online`,
      generateDescription: ({ doc }) => doc?.excerpt ?? doc?.intro ?? '',
      generateImage: ({ doc }) => doc?.heroImage,
      generateURL: async ({ collectionConfig, doc, req }) =>
        collectionConfig?.slug === 'pages'
          ? `${serverURL}/${doc?.slug ?? ''}`
          : `${serverURL}${(await postPath(req.payload, doc, req)) ?? ''}`,
    }),
    // Without a token (local development) the plugin is disabled and media is stored on disk.
    vercelBlobStorage({
      // The plugin adds columns to media. Add them even when disabled, so the schema (and the
      // migrations generated locally) match production, where the token is set.
      alwaysInsertFields: true,
      // Media is public ("anyone" can read), so serve files straight from Blob's CDN
      // rather than through a server function on every request.
      collections: { media: { disablePayloadAccessControl: true } },
      token: process.env.BLOB_READ_WRITE_TOKEN,
      // Browser uploads straight to Blob: Vercel functions reject request bodies over
      // 4.5 MB, and photos from a phone or camera are often bigger.
      clientUploads: true,
    }),
  ],
  // Scheduled publishing queues jobs in the "default" queue; something has to run them.
  // They always run through GET /api/payload-jobs/run — inside a Next request, so the
  // published page's cache is cleared. (Payload's in-process autoRun can't do that.)
  // - Production: the Vercel cron in vercel.json calls it daily at 06:00 UTC (the Hobby plan's
  //   limit) with `Authorization: Bearer $CRON_SECRET`. Scheduled posts go live at that run.
  // - Locally: open /api/payload-jobs/run while signed in as an admin.
  // A scheduled publish runs as the user who scheduled it, so the author publish gate still applies.
  jobs: {
    access: {
      run: ({ req }) => {
        if (isAdmin(req.user as User | null)) return true
        const secret = process.env.CRON_SECRET
        return Boolean(secret) && req.headers.get('authorization') === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
  cors: [serverURL],
  csrf: [serverURL],
})
