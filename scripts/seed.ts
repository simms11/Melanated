/**
 * Seeds the editorial categories, the first admin user and draft legal pages.
 * Idempotent: safe to run more than once, never overwrites.
 *
 *   pnpm seed                                    # local: development defaults
 *   NODE_ENV=production SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... DATABASE_URL=... pnpm seed
 *
 * A hosted database is refused unless it's production mode with a real email and strong
 * password (scripts/lib/seedPreflight.ts).
 */
import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../src/payload.config'

import { PRIVACY, TERMS } from './content/legal'
import { DEFAULT_PASSWORD, seedPreflight } from './lib/seedPreflight'
import { toLexical } from './lib/lexical'

const CATEGORIES = [
  {
    title: 'Fashion',
    slug: 'fashion',
    tagline: 'Timeless style. Bold looks. Real women.',
    description: 'Style inspiration, fashion trends, outfit ideas and recommendations.',
    order: 1,
  },
  {
    title: 'Beauty',
    slug: 'beauty',
    tagline: 'Skincare, makeup, hair and self-care rituals.',
    description: 'Skincare, makeup, beauty routines and product recommendations.',
    order: 2,
  },
  {
    title: 'Wellness',
    slug: 'wellness',
    tagline: 'Mental, physical and spiritual well-being.',
    description: 'Self-care, mental wellbeing, personal growth and holistic living.',
    order: 3,
  },
  {
    title: 'Business',
    slug: 'business',
    tagline: 'Strategy, tools and real stories of success.',
    description:
      'Entrepreneurship, business advice, success stories and resources for Black women entrepreneurs.',
    order: 4,
  },
]

async function seed() {
  // Before connecting: a push or a default login must never reach a hosted database.
  const problems = seedPreflight(process.env)
  if (problems.length) {
    console.error(`pnpm seed refused:\n- ${problems.join('\n- ')}`)
    process.exit(1)
  }
  const payload = await getPayload({ config })

  for (const cat of CATEGORIES) {
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: cat.slug } },
      limit: 1,
    })
    if (existing.totalDocs === 0) {
      await payload.create({
        collection: 'categories',
        data: cat,
        context: { disableRevalidate: true },
      })
      payload.logger.info(`Created category: ${cat.title}`)
    }
  }

  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@melanatedonline.com'
  const password = process.env.SEED_ADMIN_PASSWORD ?? DEFAULT_PASSWORD
  const users = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
  })
  if (users.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: { email, password, name: 'Site Admin', role: 'admin' },
      context: { disableRevalidate: true },
    })
    payload.logger.info(`Created admin user ${email} — change the password after first login.`)
  }

  // Draft legal pages, for the client to review, complete and publish. Never overwrites a
  // page that already exists, so re-running the seed can't undo the client's edits.
  for (const page of [PRIVACY, TERMS]) {
    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: page.slug } },
      limit: 1,
      draft: true,
    })
    if (existing.totalDocs === 0) {
      await payload.create({
        collection: 'pages',
        data: {
          title: page.title,
          slug: page.slug,
          intro: page.intro,
          content: toLexical(page.content) as never,
          showInFooter: true,
          _status: 'draft',
        },
        draft: true,
        context: { disableRevalidate: true },
      })
      payload.logger.info(`Created draft page: ${page.title} (review and publish it in the admin)`)
    }
  }

  payload.logger.info('Seed complete')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
