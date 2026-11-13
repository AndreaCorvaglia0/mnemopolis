import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  // dist/ keeps player.html (npm run build:player) when the course build runs
  build: { assetsInlineLimit: 100000000, chunkSizeWarningLimit: 5000, cssCodeSplit: false, emptyOutDir: false },
});
