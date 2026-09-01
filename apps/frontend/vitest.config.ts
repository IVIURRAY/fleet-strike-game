import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/main.ts',
        // These drive the PixiJS renderer and a live socket. They need a real
        // GPU context and server, so they are covered by the end-to-end run
        // rather than unit tests.
        'src/app.ts',
        'src/match-view.ts',
        'src/game/canvas/**',
        'src/game/graphics/**',
      ],
    },
  },
});
