/**
 * Is a database on this machine? Used to keep throwaway writes (demo seed, tests) and
 * Payload's schema push away from hosted databases.
 */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

export const isLocalDatabaseUrl = (url: string): boolean => {
  try {
    const { hostname } = new URL(url)
    if (hostname === '') return true // Unix socket, e.g. postgres:///db
    return LOCAL_HOSTS.has(hostname) || hostname.endsWith('.localhost')
  } catch {
    return false
  }
}

/**
 * Payload's dev "push" syncs the schema directly and marks the database as dev-managed, after
 * which `payload migrate` stops applying migrations non-interactively. So push only a local
 * development database; anything hosted, or production, is migrated instead.
 */
export const shouldPushSchema = (env: { DATABASE_URL?: string; NODE_ENV?: string }): boolean =>
  env.NODE_ENV !== 'production' && !!env.DATABASE_URL && isLocalDatabaseUrl(env.DATABASE_URL)
