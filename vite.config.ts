/// <reference types="vitest" />
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const lifecycleEvent = process.env.npm_lifecycle_event ?? "";
const isVitePress = lifecycleEvent.startsWith("docs:");

export default defineConfig({
  plugins: isVitePress ? [] : [vue()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
  },
});
