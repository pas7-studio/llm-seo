import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'cli/bin': 'src/cli/bin.ts',
    'core/index': 'src/core/index.ts',
    'schema/index': 'src/schema/index.ts',
    'adapters/index': 'src/adapters/index.ts',
    'adapters/next/index': 'src/adapters/next/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: false,
  splitting: false,
  treeshake: true,
  outDir: 'dist',
  outExtension: () => ({ js: '.js' }),
  onSuccess: async () => {
    // Add shebang to CLI bin file
    const fs = await import('fs');
    const path = await import('path');
    const binPath = path.resolve('dist/cli/bin.js');
    if (fs.existsSync(binPath)) {
      let content = fs.readFileSync(binPath, 'utf8');
      if (!content.startsWith('#!/usr/bin/env node')) {
        content = '#!/usr/bin/env node\n' + content;
        fs.writeFileSync(binPath, content);
      }
    }
  },
});
