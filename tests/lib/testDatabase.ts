/**
 * Integration tests get their own database so they never write to (or leave stale cache
 * entries in) the database the dev server is showing. TEST_DATABASE_URL wins; otherwise
 * it's DATABASE_URL with "_test" added to the database name.
 */
export const testDatabaseUrl = (): string | undefined => {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL
  const base = process.env.DATABASE_URL
  if (!base) return undefined
  const url = new URL(base)
  const name = decodeURIComponent(url.pathname.replace(/^\//, '')) || 'postgres'
  if (!name.endsWith('_test')) url.pathname = `/${name}_test`
  return url.toString()
}
