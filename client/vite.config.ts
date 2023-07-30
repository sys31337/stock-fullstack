import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import I18nHotReload from 'vite-plugin-i18n-hot-reload';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({ plugins: [["@swc/plugin-styled-components", {}]] }), tsconfigPaths(), I18nHotReload({ folder: './src/locales' })],
  build: {
    sourcemap: !!process.env.BUILD_SOURCE_MAPS,
  },
});
