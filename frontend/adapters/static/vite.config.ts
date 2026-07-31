import { staticAdapter } from "@builder.io/qwik-city/adapters/static/vite";
import { extendConfig } from "@builder.io/qwik-city/vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import baseConfig from "../../vite.config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = resolve(__dirname, "../../src");

export default extendConfig(baseConfig, () => {
  return {
    resolve: {
      alias: {
        "~": srcDir,
      },
    },
    build: {
      ssr: true,
      rollupOptions: {
        input: ["@qwik-city-plan"],
      },
    },
    plugins: [
      staticAdapter({
        origin: process.env.VITE_APP_ORIGIN ?? "https://dev.d1qwgdujp8oq1u.amplifyapp.com",
        // Exclude routes that require server-side auth (cookies/redirects)
        // These are served as SPA by the Amplify catch-all rewrite rule
        exclude: [
          "/auth/*",
          "/dashboard",
          "/chat",
          "/conversations/*",
          "/profile",
          "/admin/*",
        ],
      }),
    ],
  };
});
