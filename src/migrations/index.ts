import * as migration_20261021_164734_initial_schema_with_disclosure from './20261021_164734_initial_schema_with_disclosure';

export const migrations = [
  {
    up: migration_20261021_164734_initial_schema_with_disclosure.up,
    down: migration_20261021_164734_initial_schema_with_disclosure.down,
    name: '20261021_164734_initial_schema_with_disclosure'
  },
];
