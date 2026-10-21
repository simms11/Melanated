import * as migration_20261021_164734_initial_schema_with_disclosure from './20261021_164734_initial_schema_with_disclosure';
import * as migration_20261021_170045_add_redirects from './20261021_170045_add_redirects';
import * as migration_20261021_171525_add_reactions from './20261021_171525_add_reactions';
import * as migration_20261021_173807_add_media_uploaded_by from './20261021_173807_add_media_uploaded_by';
import * as migration_20261021_183547_add_heart_votes_and_limits from './20261021_183547_add_heart_votes_and_limits';

export const migrations = [
  {
    up: migration_20261021_164734_initial_schema_with_disclosure.up,
    down: migration_20261021_164734_initial_schema_with_disclosure.down,
    name: '20261021_164734_initial_schema_with_disclosure',
  },
  {
    up: migration_20261021_170045_add_redirects.up,
    down: migration_20261021_170045_add_redirects.down,
    name: '20261021_170045_add_redirects',
  },
  {
    up: migration_20261021_171525_add_reactions.up,
    down: migration_20261021_171525_add_reactions.down,
    name: '20261021_171525_add_reactions',
  },
  {
    up: migration_20261021_173807_add_media_uploaded_by.up,
    down: migration_20261021_173807_add_media_uploaded_by.down,
    name: '20261021_173807_add_media_uploaded_by',
  },
  {
    up: migration_20261021_183547_add_heart_votes_and_limits.up,
    down: migration_20261021_183547_add_heart_votes_and_limits.down,
    name: '20261021_183547_add_heart_votes_and_limits'
  },
];
