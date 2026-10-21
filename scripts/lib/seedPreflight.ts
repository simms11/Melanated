import { isLocalDatabaseUrl } from '../../src/lib/localDatabase'

const DEFAULT_PASSWORD = 'ChangeMe123!'

/**
 * Reasons `pnpm seed` must not run, or [] if it may. A local database may use the
 * development defaults. A hosted one (production) needs production mode, so Payload never
 * pushes the schema there, and a real admin email and strong password, so the live site never
 * gets the default login published in this repo.
 */
export const seedPreflight = (env: {
  DATABASE_URL?: string
  NODE_ENV?: string
  SEED_ADMIN_EMAIL?: string
  SEED_ADMIN_PASSWORD?: string
}): string[] => {
  if (!env.DATABASE_URL) return ['DATABASE_URL is not set.']
  if (isLocalDatabaseUrl(env.DATABASE_URL)) return []

  const problems: string[] = []
  if (env.NODE_ENV !== 'production') {
    problems.push('Run with NODE_ENV=production when seeding a hosted database.')
  }
  if (!env.SEED_ADMIN_EMAIL?.includes('@')) {
    problems.push('Set SEED_ADMIN_EMAIL to the real admin email address.')
  }
  const password = env.SEED_ADMIN_PASSWORD ?? ''
  if (!password) {
    problems.push('Set SEED_ADMIN_PASSWORD.')
  } else if (password === DEFAULT_PASSWORD) {
    problems.push('SEED_ADMIN_PASSWORD is the default from this repo; choose a new one.')
  } else if (password.length < 16) {
    problems.push('SEED_ADMIN_PASSWORD must be at least 16 characters.')
  }
  return problems
}

export { DEFAULT_PASSWORD }
