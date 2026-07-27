import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  build: {
    target: 'baseline-widely-available',
    sourcemap: false,
    minify: true,
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        part2: resolve(import.meta.dirname, 'part2.html')
      }
    }
  }
});
