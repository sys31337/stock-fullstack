import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@config': resolve('src/renderer/src/config'),
        '@shared': resolve('src/renderer/src/shared'),
        '@theme': resolve('src/renderer/src/theme'),
        '@modules': resolve('src/renderer/src/modules'),
        // "@modules/*": [
        //   "src/renderer/src/modules/*"
        // ],
        // "@config": [
        //   "src/renderer/src/config"
        // ],
        // "@config/*": [
        //   "src/renderer/src/config/*"
        // ],
        // "@shared/*": [
        //   "src/renderer/src/shared/*"
        // ],
        // "@theme/*": [
        //   "src/renderer/src/theme/*"
        // ]
      },
    },
    plugins: [react()],
  },
});
