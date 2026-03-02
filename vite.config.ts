import path from "path";
import react from "@vitejs/plugin-react-swc";
import { nodePolyfills } from "vite-plugin-node-polyfills";

/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api/crawl': {
        target: 'http://52.3.225.193:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/crawl/, ''),
      },
    },
  },
  test: {
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    exclude: ["**/__tests__/**/*"],
    includeSource: ["src/**/*.{ts,tsx}"],
    reporters: ["default", "jest-html-reporters"],
  },
});
