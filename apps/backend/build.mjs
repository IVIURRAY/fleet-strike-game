/**
 * Backend bundler.
 *
 * TypeScript emits extensionless relative imports (`./balance`), which Node's
 * ESM loader rejects at runtime even though bundlers and Vitest resolve them
 * fine. Rather than append `.js` to every relative import across every
 * package, the server is bundled: workspace packages are inlined and real npm
 * dependencies stay external so they resolve from node_modules as usual.
 *
 * This also keeps the production Docker image small.
 */

import { build } from 'esbuild';
import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// Everything published to npm stays external; @fleet-strike/* gets inlined.
const external = Object.keys(packageJson.dependencies ?? {}).filter(
  (name) => !name.startsWith('@fleet-strike/')
);

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  sourcemap: true,
  external,
  logLevel: 'info',
  // Node 20 ESM has no `require`; provide the shim some CJS deps expect.
  banner: {
    js: [
      "import { createRequire as __createRequire } from 'node:module';",
      'const require = __createRequire(import.meta.url);',
    ].join('\n'),
  },
});
