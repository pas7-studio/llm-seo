import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    snapshotFormat: {
      escapeString: true,
      printBasicPrototype: true,
    },
    snapshotSerializers: [],
    globals: false,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/', 'dist/'],
    },
  },
});
