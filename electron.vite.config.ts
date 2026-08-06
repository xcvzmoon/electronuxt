import { defineConfig } from 'electron-vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  main: {
    build: {
      outDir: resolve(dirname, '.electron/dist/main'),
      externalizeDeps: false,
      rollupOptions: {
        input: resolve(dirname, 'electron/main/index.ts'),
        output: {
          format: 'es',
        },
      },
    },
  },
  preload: {
    build: {
      outDir: resolve(dirname, '.electron/dist/preload'),
      externalizeDeps: false,
      rollupOptions: {
        input: resolve(dirname, 'electron/preload/index.ts'),
        output: {
          format: 'cjs',
        },
      },
    },
  },
});
