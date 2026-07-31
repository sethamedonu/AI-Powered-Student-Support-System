import { extendConfig } from "@builder.io/qwik-city/vite";
import baseConfig from "../../vite.config";

// Build the SSR server bundle using Qwik City's built-in SSR support.
// No third-party node-server adapter needed — qwikCity() + qwikVite() from
// the base config handle SSR bundling natively.
export default extendConfig(baseConfig, () => {
  return {
    build: {
      ssr: true,
      outDir: "dist/server",
      rollupOptions: {
        input: ["src/entry.node-server.tsx", "@qwik-city-plan"],
        output: {
          // Emit a single entry file that build-amplify.mjs can reference
          entryFileNames: "[name].js",
        },
      },
    },
  };
});
