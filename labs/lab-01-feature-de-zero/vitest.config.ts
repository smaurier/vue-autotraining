// Oracle du lab : `@lab/*` -> TON code (src/). `npm run lab:01` depuis 02-vue/labs.
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { "@lab": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "happy-dom",
    include: ["test/**/*.spec.ts", "test/**/*.test.ts"],
    typecheck: { enabled: true, checker: "vue-tsc", include: ["test/**/*.test-d.ts"], tsconfig: "./tsconfig.json" },
  },
});
