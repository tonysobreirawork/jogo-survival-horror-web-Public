import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'baseline-widely-available',
    sourcemap: false,
    minify: true,
    cssCodeSplit: true
  }
});
