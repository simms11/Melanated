import { describe, expect, it } from 'vitest'

import { isLocalDatabaseUrl } from '../../scripts/lib/assertLocalDatabase'

describe('isLocalDatabaseUrl', () => {
  it('accepts databases on this machine', () => {
    for (const url of [
      'postgres://postgres:postgres@127.0.0.1:5432/melanated_online',
      'postgres://u:p@localhost:5433/db',
      'postgresql://u:p@[::1]:5432/db',
      'postgres://u:p@db.localhost/db',
      'postgres:///melanated_online', // Unix socket
    ]) {
      expect(isLocalDatabaseUrl(url), url).toBe(true)
    }
  })

  it('rejects anything hosted, so demo data and test writes never reach production', () => {
    for (const url of [
      'postgres://u:p@ep-cool-name-123456.eu-west-2.aws.neon.tech/neondb?sslmode=require',
      'postgres://u:p@db.example.com:5432/prod',
      'postgres://u:p@localhost.evil.com/db',
      'postgres://u:p@10.0.0.5/db',
      'not a url',
    ]) {
      expect(isLocalDatabaseUrl(url), url).toBe(false)
    }
  })
})
