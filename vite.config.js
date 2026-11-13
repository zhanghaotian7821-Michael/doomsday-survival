import { defineConfig } from 'vite';

export default defineConfig({
  // 相对路径：GitHub Pages 子路径（/doomsday-survival/）下也能直接打开
  base: './',
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 4096
  },
  server: {
    port: 5173,
    open: false
  }
});
