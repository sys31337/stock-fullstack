// electron.vite.config.ts
import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    server: {
      hmr: true
    },
    resolve: {
      alias: {
        "@api/config": resolve("src/main/api/config"),
        "@api/constants": resolve("src/main/api/constants"),
        "@api/controllers": resolve("src/main/api/controllers"),
        "@api/functions": resolve("src/main/api/functions"),
        "@api/middlewares": resolve("src/main/api/middlewares"),
        "@api/socket": resolve("src/main/api/socket"),
        "@api/routes": resolve("src/main/api/routes"),
        "@api/utils": resolve("src/main/api/utils"),
        "@api/models": resolve("src/main/api/models"),
        "@api/validations": resolve("src/main/api/validations")
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    server: {
      port: 5174
    },
    resolve: {
      alias: {
        "@web/renderer": resolve("src/renderer/src"),
        "@web/config": resolve("src/renderer/src/config"),
        "@web/shared": resolve("src/renderer/src/shared"),
        "@web/theme": resolve("src/renderer/src/theme"),
        "@web/modules": resolve("src/renderer/src/modules")
      }
    },
    plugins: [react()]
  }
});
export {
  electron_vite_config_default as default
};
