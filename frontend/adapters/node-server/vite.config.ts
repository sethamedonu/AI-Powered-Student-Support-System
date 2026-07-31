import { defineConfig } from "vite";
import { qwikVite } from "@builder.io/qwik/optimizer";
import { qwikCity } from "@builder.io/qwik-city/vite";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * SSR server build config for the Node.js entry point.
 * Produces dist/server/entry.node-server.js — the file that
 * build-amplify.mjs copies into .amplify-hosting/compute/default/.
 */
export default defineConfig({
  plugins: [qwikCity(), qwikVite(), tsconfigPaths()],
  build: {
    ssr: "src/entry.node-server.tsx",
    outDir: "dist/server",
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name]-[hash].js",
      },
    },
  },
});
