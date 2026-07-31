import { extendConfig } from "@builder.io/qwik-city/vite";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import baseConfig from "../../vite.config";

const __dirname = dirname(fileURLToPath(import.meta.url));
// rootDir = frontend/  (two levels up from adapters/node-server/)
const rootDir = resolve(__dirname, "../..");

// Build the SSR server bundle using Qwik City's built-in SSR support.
// No third-party node-server adapter needed — qwikCity() + qwikVite() from
// the base config handle SSR bundling natively.
export default extendConfig(baseConfig, () => {
  return {
    // Set root explicitly so all relative paths in rollupOptions resolve from frontend/
    root: rootDir,
    build: {
      ssr: true,
      outDir: resolve(rootDir, "dist/server"),
      rollupOptions: {
        input: {
          "entry.node-server": resolve(rootDir, "src/entry.node-server.tsx"),
          "qwik-city-plan": "@qwik-city-plan",
        },
        output: {
          entryFileNames: "[name].js",
        },
      },
    },
  };
});
