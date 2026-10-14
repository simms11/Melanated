/**
 * Seeds the five editorial categories and a default admin user.
 * Idempotent — safe to run more than once.
 *
 *   pnpm seed
 *
 * Set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD to control the first admin account.
 */
import 'dotenv/config'
import { getPayload } from 'payload'

import config from '../src/payload.config'

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
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!'
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

  payload.logger.info('Seed complete')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
