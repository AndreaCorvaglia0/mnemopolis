// The /play/ page (player/index.html): turns course files into a game in the browser.
// npm run build:play -> dist/play/index.html; it fetches player.html from its own folder.
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  root: 'player',
  plugins: [viteSingleFile()],
  build: { outDir: '../dist/play', emptyOutDir: true, assetsInlineLimit: 100000000, cssCodeSplit: false },
});
