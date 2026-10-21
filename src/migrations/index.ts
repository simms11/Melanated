import * as migration_20261021_164734_initial_schema_with_disclosure from './20261021_164734_initial_schema_with_disclosure';
import * as migration_20261021_170045_add_redirects from './20261021_170045_add_redirects';
import * as migration_20261021_171525_add_reactions from './20261021_171525_add_reactions';

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
    name: '20261021_171525_add_reactions'
  },
];
