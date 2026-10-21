import { describe, expect, it } from 'vitest'

import { shouldPushSchema } from '@/lib/localDatabase'

import { seedPreflight } from '../../scripts/lib/seedPreflight'

const LOCAL = 'postgres://postgres:postgres@127.0.0.1:5432/melanated_online'
const HOSTED = 'postgres://u:p@ep-quiet-sky-123.eu-west-2.aws.neon.tech/neondb?sslmode=require'
const STRONG = 'Xq7!mP2v9LrT4sW8yZ1k'

describe('schema push', () => {
  // A push marks the database as dev-managed, after which `payload migrate` stops applying
  // migrations non-interactively. Only ever push a local development database.
  it('pushes only a local database outside production', () => {
    expect(shouldPushSchema({ DATABASE_URL: LOCAL, NODE_ENV: 'development' })).toBe(true)
    expect(shouldPushSchema({ DATABASE_URL: LOCAL, NODE_ENV: 'test' })).toBe(true)
    expect(shouldPushSchema({ DATABASE_URL: HOSTED, NODE_ENV: 'development' })).toBe(false)
    expect(shouldPushSchema({ DATABASE_URL: HOSTED, NODE_ENV: undefined })).toBe(false)
    expect(shouldPushSchema({ DATABASE_URL: LOCAL, NODE_ENV: 'production' })).toBe(false)
  })
})

describe('seed preflight', () => {
  it('lets a local database use the development defaults', () => {
    expect(seedPreflight({ DATABASE_URL: LOCAL })).toEqual([])
  })

  it('refuses a hosted database without production mode', () => {
    const problems = seedPreflight({
      DATABASE_URL: HOSTED,
      SEED_ADMIN_EMAIL: 'owner@example.com',
      SEED_ADMIN_PASSWORD: STRONG,
    })
    expect(problems.join(' ')).toMatch(/NODE_ENV=production/)
  })

  it('refuses a hosted database without a real admin email and strong password', () => {
    const base = { DATABASE_URL: HOSTED, NODE_ENV: 'production' }
    expect(seedPreflight(base).join(' ')).toMatch(/SEED_ADMIN_EMAIL/)
    expect(seedPreflight(base).join(' ')).toMatch(/SEED_ADMIN_PASSWORD/)
    expect(
      seedPreflight({
        ...base,
        SEED_ADMIN_EMAIL: 'o@example.com',
        SEED_ADMIN_PASSWORD: 'short',
      }).join(' '),
    ).toMatch(/at least 16/)
    expect(
      seedPreflight({
        ...base,
        SEED_ADMIN_EMAIL: 'o@example.com',
        SEED_ADMIN_PASSWORD: 'ChangeMe123!',
      }).join(' '),
    ).toMatch(/default/)
  })

  it('accepts a hosted database in production mode with real credentials', () => {
    expect(
      seedPreflight({
        DATABASE_URL: HOSTED,
        NODE_ENV: 'production',
        SEED_ADMIN_EMAIL: 'owner@example.com',
        SEED_ADMIN_PASSWORD: STRONG,
      }),
    ).toEqual([])
  })
})
