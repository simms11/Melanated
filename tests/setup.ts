import 'dotenv/config'

import { assertLocalDatabase } from '../scripts/lib/assertLocalDatabase'

// Integration tests create users and posts and toggle Site Settings. Fail before any of
// that if DATABASE_URL isn't a local database.
assertLocalDatabase('Integration tests')
