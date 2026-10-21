/**
 * Fails the deploy if any migration is still pending after `pnpm migrate`.
 *
 *   pnpm migrate:check
 *
 * On 2026-10-21 `payload migrate` exited 0 on Vercel without printing anything or applying
 * a new migration (the build had restored Vercel's build cache), and the deploy went live
 * against an out-of-date schema. This turns that silent skip into a failed build.
 */
import 'dotenv/config'
import { getPayload, readMigrationFiles } from 'payload'

import config from '../src/payload.config'

async function check() {
  const payload = await getPayload({ config })
  const files = await readMigrationFiles({ payload })
  const { docs } = await payload.find({
    collection: 'payload-migrations',
    limit: 0,
    pagination: false,
    depth: 0,
  })
  const applied = new Set(docs.map((doc) => doc.name))
  const pending = files.map((file) => file.name).filter((name) => !applied.has(name))

  if (pending.length > 0) {
    payload.logger.error(`Migrations not applied: ${pending.join(', ')}`)
    process.exit(1)
  }
  payload.logger.info(`All ${files.length} migrations are applied.`)
  process.exit(0)
}

check().catch((error) => {
  console.error(error)
  process.exit(1)
})
