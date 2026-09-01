import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        // Entry point: process wiring and signal handlers, exercised by the
        // container healthcheck rather than unit tests.
        'src/index.ts',
        // Development-only balance and performance harness.
        'src/playtest.ts',
        'src/**/index.ts',
      ],
    },
  },
});
