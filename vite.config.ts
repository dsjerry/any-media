import { defineConfig } from "vite"
import { resolve } from "path"
import vue from "@vitejs/plugin-vue"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  root: "src/renderer/src",
  base: "./",
  build: {
    outDir: "../../../dist/renderer",
    assetsDir: "assets",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/renderer/src/index.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src/renderer/src"),
    },
  },
  server: {
    port: 3000,
  },
})
