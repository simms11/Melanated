/**
 * Guard for scripts and tests that write throwaway data (demo posts and photos,
 * test users, toggled Site Settings). They must never run against a hosted database.
 * Override deliberately with ALLOW_NON_LOCAL_DATABASE=1, e.g. for a disposable cloud branch.
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

export const assertLocalDatabase = (what: string, url = process.env.DATABASE_URL): void => {
  if (!url || process.env.ALLOW_NON_LOCAL_DATABASE === '1') return
  if (isLocalDatabaseUrl(url)) return
  const host = (() => {
    try {
      return new URL(url).hostname
    } catch {
      return 'an unrecognised address'
    }
  })()
  throw new Error(
    `${what} refused to run: DATABASE_URL points at ${host}, not this machine. ` +
      'These write throwaway data. Set ALLOW_NON_LOCAL_DATABASE=1 only for a disposable database.',
  )
}
