import 'dotenv/config'
import pg from 'pg'

import { assertLocalDatabase } from '../scripts/lib/assertLocalDatabase'

import { testDatabaseUrl } from './lib/testDatabase'

/** Creates the test database once per run if it doesn't exist; Payload pushes the schema. */
export default async function globalSetup() {
  const url = testDatabaseUrl()
  if (!url) return
  assertLocalDatabase('Integration tests', url)

  const target = new URL(url)
  const name = decodeURIComponent(target.pathname.replace(/^\//, ''))
  const admin = new URL(url)
  admin.pathname = '/postgres'

  const client = new pg.Client({ connectionString: admin.toString() })
  await client.connect()
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name])
    if (!rowCount) await client.query(`CREATE DATABASE "${name.replace(/"/g, '""')}"`)
  } finally {
    await client.end()
  }
}
