import { describe, expect, it } from 'vitest'

import { productionEnvProblems } from '@/lib/productionEnv'

const good = {
  VERCEL_ENV: 'production',
  PAYLOAD_SECRET: 'a'.repeat(64),
  CRON_SECRET: 'b'.repeat(64),
  BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_x',
  NEXT_PUBLIC_SERVER_URL: 'https://melanatedonline.com',
  DATABASE_URL: 'postgres://u:p@ep-x.neon.tech/db',
}

describe('production settings check', () => {
  it('only applies to real production deploys (not local, CI or previews)', () => {
    expect(productionEnvProblems({})).toEqual([])
    expect(productionEnvProblems({ VERCEL_ENV: 'preview' })).toEqual([])
  })

  it('accepts a complete production configuration', () => {
    expect(productionEnvProblems(good)).toEqual([])
  })

  // Without a Blob token, uploads land on Vercel's ephemeral disk and vanish on the next
  // deploy; without CRON_SECRET, scheduled posts never publish. Fail the deploy instead.
  it('names every missing or unsafe setting', () => {
    const problems = productionEnvProblems({
      ...good,
      BLOB_READ_WRITE_TOKEN: '',
      CRON_SECRET: undefined,
      PAYLOAD_SECRET: 'short',
      NEXT_PUBLIC_SERVER_URL: 'http://localhost:3000',
    }).join(' ')
    expect(problems).toMatch(/BLOB_READ_WRITE_TOKEN/)
    expect(problems).toMatch(/CRON_SECRET/)
    expect(problems).toMatch(/PAYLOAD_SECRET/)
    expect(problems).toMatch(/NEXT_PUBLIC_SERVER_URL/)
  })
})
