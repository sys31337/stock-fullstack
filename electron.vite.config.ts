import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@api/config': resolve('src/main/api/config'),
        '@api/constants': resolve('src/main/api/constants'),
        '@api/controllers': resolve('src/main/api/controllers'),
        '@api/functions': resolve('src/main/api/functions'),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    resolve: {
      alias: {
        '@web/renderer': resolve('src/renderer/src'),
        '@web/config': resolve('src/renderer/src/config'),
        '@web/shared': resolve('src/renderer/src/shared'),
        '@web/theme': resolve('src/renderer/src/theme'),
        '@web/modules': resolve('src/renderer/src/modules'),
      },
    },
    plugins: [react()],
  },
});
