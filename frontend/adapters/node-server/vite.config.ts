import { extendConfig } from "@builder.io/qwik-city/vite";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import baseConfig from "../../vite.config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "../..");

// Build the SSR server bundle using Qwik City's built-in SSR support.
// No third-party node-server adapter needed — qwikCity() + qwikVite() from
// the base config handle SSR bundling natively.
export default extendConfig(baseConfig, () => {
  return {
    build: {
      ssr: true,
      outDir: "dist/server",
      rollupOptions: {
        input: [
          resolve(rootDir, "src/entry.node-server.tsx"),
          "@qwik-city-plan",
        ],
        output: {
          // Emit a consistent entry filename that build-amplify.mjs can reference
          entryFileNames: "[name].js",
        },
      },
    },
  };
});
