import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ['tests/int/**/*.int.spec.ts'],
    environment: 'node',
    // Database tests share one Postgres and one Site Settings global (some toggle the
    // author publish gate), so test files must not run in parallel.
    fileParallelism: false,
  },
})
