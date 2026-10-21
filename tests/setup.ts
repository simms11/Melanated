import 'dotenv/config'

import { assertLocalDatabase } from '../scripts/lib/assertLocalDatabase'

import { testDatabaseUrl } from './lib/testDatabase'

// Point Payload at the test database before any test file imports the config. dotenv never
// overrides a variable that is already set, so test files loading .env keep this value.
const url = testDatabaseUrl()
if (url) process.env.DATABASE_URL = url

// Integration tests create users and posts and toggle Site Settings. Fail before any of
// that if the database isn't on this machine.
assertLocalDatabase('Integration tests')
