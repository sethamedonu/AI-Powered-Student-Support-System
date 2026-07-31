import { defineConfig } from "vite";
import { qwikVite } from "@builder.io/qwik/optimizer";
import { qwikCity } from "@builder.io/qwik-city/vite";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * SSR server build config for Amplify WEB_COMPUTE.
 *
 * Registers entry.node-server.tsx as a custom SSR entry via qwikVite's
 * ssr.input option, which tells the Qwik optimizer to accept it.
 * Produces dist/server/entry.node-server.js — the Node HTTP server that
 * build-amplify.mjs copies to .amplify-hosting/compute/default/.
 */
export default defineConfig({
  plugins: [
    qwikCity(),
    qwikVite({
      ssr: {
        input: "src/entry.node-server.tsx",
        outDir: "dist/server",
      },
    }),
    tsconfigPaths(),
  ],
  build: {
    ssr: true,
    outDir: "dist/server",
    rollupOptions: {
      input: ["src/entry.node-server.tsx", "@qwik-city-plan"],
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name]-[hash].js",
      },
    },
  },
});
