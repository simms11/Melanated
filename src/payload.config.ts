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
import { Posts } from './collections/Posts'
import { postPath } from './collections/Posts/postPath'
import { Users } from './collections/Users'
import { SiteSettings } from './globals/SiteSettings'
import type { User } from './payload-types'
import { admins, authenticated, isAdmin } from './access'
import { revalidateRedirects } from './hooks/redirects'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export default buildConfig({
  serverURL,
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' · Melanated Online',
    },
  },
  collections: [Posts, Categories, Media, Users],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL || '' },
    // Use migrations in production; push schema automatically in dev.
    push: process.env.NODE_ENV !== 'production',
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
      collections: ['posts'],
      uploadsCollection: 'media',
      generateTitle: ({ doc }) => `${doc?.title ?? ''} · Melanated Online`,
      generateDescription: ({ doc }) => doc?.excerpt ?? '',
      generateImage: ({ doc }) => doc?.heroImage,
      generateURL: async ({ doc, req }) =>
        `${serverURL}${(await postPath(req.payload, doc, req)) ?? ''}`,
    }),
    ...(process.env.BLOB_READ_WRITE_TOKEN
      ? [
          vercelBlobStorage({
            collections: { media: true },
            token: process.env.BLOB_READ_WRITE_TOKEN,
          }),
        ]
      : []),
  ],
  // Scheduled publishing queues jobs in the "default" queue; something has to run them.
  // They always run through GET /api/payload-jobs/run — inside a Next request, so the
  // published page's cache is cleared. (Payload's in-process autoRun can't do that.)
  // - Production: the Vercel cron in vercel.json calls it with `Authorization: Bearer $CRON_SECRET`.
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
