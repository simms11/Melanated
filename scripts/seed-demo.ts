/**
 * Loads placeholder photography and one demo post per category, so the design can be
 * judged with real imagery before the client's own content exists.
 *
 *   pnpm seed:demo           # create (idempotent)
 *   pnpm seed:demo --reset   # remove everything this script created
 *
 * Photos are read from content/media/demo/ (git-ignored; placeholders for local design
 * review only). Run `pnpm seed` first for categories + admin.
 */
import 'dotenv/config'
import path from 'node:path'
import { getPayload } from 'payload'

import config from '../src/payload.config'

import { assertLocalDatabase } from './lib/assertLocalDatabase'

// Demo content is for local design review only: never seed it into a hosted database.
assertLocalDatabase('pnpm seed:demo')

const DEMO_TAG = 'demo-content'
const PHOTO_DIR = path.resolve(import.meta.dirname, '../content/media/demo')

type DemoPost = {
  photo: string
  alt: string
  category: string
  title: string
  slug: string
  excerpt: string
  featured?: boolean
  trending?: boolean
  disclosure?: 'ad' | 'affiliate' | 'gifted'
  disclosurePartner?: string
}

const POSTS: DemoPost[] = [
  {
    photo: 'orange-braids-face-serum.jpeg',
    alt: 'Woman with bright orange braids gathered into a high bun, applying a drop of face serum from a pipette.',
    category: 'beauty',
    title: 'The Five-Minute Serum Ritual That Changed My Skin',
    slug: 'demo-five-minute-serum-ritual',
    disclosure: 'gifted',
    disclosurePartner: 'Example Brand',
    excerpt: 'Fewer products, better order. How to layer a serum so it actually does its job.',
    featured: true,
  },
  {
    photo: 'bantu-knots-orange-tulle.jpeg',
    alt: 'Woman with sculpted Bantu knots and pearl accents, wrapped in voluminous orange tulle against a deep red backdrop.',
    category: 'fashion',
    title: 'Colour Drenching: Wearing One Shade Head to Toe',
    slug: 'demo-colour-drenching',
    disclosure: 'affiliate',
    excerpt: 'Monochrome dressing is the boldest quiet move in fashion right now.',
    trending: true,
  },
  {
    photo: 'afro-smile-portrait.jpeg',
    alt: 'Smiling woman with a full natural afro resting her chin on her hand against a warm peach background.',
    category: 'wellness',
    title: 'Joy as a Practice, Not a Mood',
    slug: 'demo-joy-as-a-practice',
    excerpt: 'Small daily habits that protect your peace when life gets loud.',
    trending: true,
  },
  {
    photo: 'braided-updo-copper-curls.jpeg',
    alt: 'Woman in profile with a braided crown and long copper curls, wearing gold earrings at an evening event.',
    category: 'business',
    title: 'How to Work a Room When You Hate Networking',
    slug: 'demo-work-a-room',
    excerpt: 'A five-step plan for events, from the first hello to the follow-up email.',
    trending: true,
  },
  {
    photo: 'natural-hair-styling-session.jpeg',
    alt: 'Young woman with voluminous natural hair having it styled with a comb by an older woman standing behind her.',
    category: 'beauty',
    title: 'Sunday Hair Days and the Women Who Raised Us',
    slug: 'demo-sunday-hair-days',
    excerpt: 'The salon chair at home is where so many of our stories start.',
    trending: true,
  },
]

const paragraph = (text: string) => ({
  type: 'paragraph',
  version: 1,
  format: '',
  indent: 0,
  direction: 'ltr' as const,
  textFormat: 0,
  children: [{ type: 'text', version: 1, text, format: 0, style: '', mode: 'normal', detail: 0 }],
})

const richText = (...paras: string[]) => ({
  root: {
    type: 'root',
    version: 1,
    format: '' as const,
    indent: 0,
    direction: 'ltr' as const,
    children: paras.map(paragraph),
  },
})

const ctx = { disableRevalidate: true }

/** Demo images are recognised by filename (Payload saves them as .webp, maybe with -1, -2). */
const demoMediaWhere = () => ({
  or: POSTS.map((p) => ({ filename: { like: path.parse(p.photo).name } })),
})

async function reset(payload: Awaited<ReturnType<typeof getPayload>>) {
  const posts = await payload.delete({
    collection: 'posts',
    where: { tags: { contains: DEMO_TAG } },
    context: ctx,
  })
  const categories = await payload.update({
    collection: 'categories',
    where: { slug: { in: POSTS.map((p) => p.category) } },
    data: { image: null },
    context: ctx,
  })
  const media = await payload.delete({
    collection: 'media',
    where: demoMediaWhere(),
    context: ctx,
  })
  payload.logger.info(
    `Removed ${posts.docs.length} demo posts and ${media.docs.length} demo images; cleared ${categories.docs.length} category images`,
  )
}

async function seed() {
  const payload = await getPayload({ config })
  if (process.argv.includes('--reset')) {
    await reset(payload)
    process.exit(0)
  }

  // The site admin from `pnpm seed`, never "any admin": test runs create and delete their
  // own admins, which would leave demo posts with no author.
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@melanatedonline.com'
  const { docs: admins } = await payload.find({
    collection: 'users',
    where: { email: { equals: adminEmail } },
    limit: 1,
  })
  if (!admins[0]) throw new Error(`No admin ${adminEmail}: run \`pnpm seed\` first.`)

  for (const post of POSTS) {
    const { docs: cats } = await payload.find({
      collection: 'categories',
      where: { slug: { equals: post.category } },
      limit: 1,
    })
    const category = cats[0]
    if (!category) {
      payload.logger.warn(`Skipping ${post.slug}: category "${post.category}" not found`)
      continue
    }

    const { docs: existingMedia } = await payload.find({
      collection: 'media',
      where: { and: [demoMediaWhere(), { alt: { equals: post.alt } }] },
      limit: 1,
    })
    const media =
      existingMedia[0] ??
      (await payload.create({
        collection: 'media',
        data: { alt: post.alt },
        filePath: path.join(PHOTO_DIR, post.photo),
        context: ctx,
      }))

    if (!category.image) {
      await payload.update({
        collection: 'categories',
        id: category.id,
        data: { image: media.id },
        context: ctx,
      })
    }

    const { totalDocs } = await payload.find({
      collection: 'posts',
      where: { slug: { equals: post.slug } },
      limit: 1,
      draft: true,
    })
    if (totalDocs > 0) continue

    await payload.create({
      collection: 'posts',
      data: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        heroImage: media.id,
        content: richText(
          post.excerpt,
          'This is placeholder copy for design review. The real article will replace it before launch.',
        ),
        category: category.id,
        authors: [admins[0].id],
        tags: [DEMO_TAG],
        featured: post.featured ?? false,
        trending: post.trending ?? false,
        disclosure: post.disclosure ?? 'none',
        disclosurePartner: post.disclosurePartner,
        publishedAt: new Date().toISOString(),
        _status: 'published',
      },
      context: ctx,
    })
    payload.logger.info(`Created demo post: ${post.title}`)
  }

  // Show the gallery block: every demo photo in the fashion post, after its text.
  const { docs: demoMedia } = await payload.find({
    collection: 'media',
    where: demoMediaWhere(),
    sort: 'createdAt',
    limit: 12,
    depth: 0,
  })
  const { docs: fashion } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: 'demo-colour-drenching' } },
    limit: 1,
    depth: 0,
  })
  if (fashion[0] && demoMedia.length >= 2) {
    const content = fashion[0].content as { root: { children: unknown[] } }
    const hasGallery = content.root.children.some((n) => (n as { type?: string }).type === 'block')
    if (!hasGallery) {
      content.root.children.push({
        type: 'block',
        version: 2,
        format: '',
        fields: {
          id: 'demo-gallery',
          blockType: 'gallery',
          blockName: '',
          images: demoMedia.map((m) => m.id),
          caption: 'One colour, five ways.',
          columns: '3',
        },
      })
      await payload.update({
        collection: 'posts',
        id: fashion[0].id,
        data: { content: content as never },
        context: ctx,
      })
      payload.logger.info('Added a demo gallery to "Colour Drenching"')
    }
  }

  payload.logger.info('Demo seed complete — restart `pnpm devsafe` to clear the page cache')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
