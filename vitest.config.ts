import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@borrowcircle/shared': fileURLToPath(new URL('./shared/src/index.ts', import.meta.url)),
    },
  },
  test: {
    maxWorkers: 1,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    include: [
      'shared/src/**/*.test.ts',
      'server/src/**/*.test.ts',
      'client/src/**/*.test.{ts,tsx}',
    ],
    environment: 'node',
  },
});
