/**
 * build-amplify.mjs
 *
 * Post-build script that reorganises Qwik City's SSR build output into the
 * directory structure required by AWS Amplify Hosting WEB_COMPUTE.
 *
 * AWS Amplify deployment specification:
 *   https://docs.aws.amazon.com/amplify/latest/userguide/ssr-deployment-specification.html
 *
 * Input (produced by Vite builds):
 *   dist/client/   — hashed JS/CSS/assets  (npm run build.client)
 *   dist/server/   — SSR render bundle     (npm run build.server  →  vite build --mode ssr)
 *
 * Output (consumed by Amplify):
 *   .amplify-hosting/
 *   ├── static/              ← dist/client/* served by CloudFront CDN
 *   ├── compute/
 *   │   └── default/
 *   │       ├── entry.ssr.js    ← Qwik render function (bundled from dist/server/)
 *   │       └── server.js       ← Node.js HTTP server wrapper (entry point)
 *   └── deploy-manifest.json ← routing rules
 */

import { cpSync, mkdirSync, rmSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ─── Paths ────────────────────────────────────────────────────────────────────
const distClient = resolve(root, "dist/client");
const distServer = resolve(root, "dist/server");
const amplifyOut = resolve(root, ".amplify-hosting");
const staticOut  = resolve(amplifyOut, "static");
const computeOut = resolve(amplifyOut, "compute/default");

// ─── Validate build inputs ────────────────────────────────────────────────────
if (!existsSync(distClient)) {
  console.error("ERROR: dist/client not found. Run 'npm run build.client' first.");
  process.exit(1);
}
if (!existsSync(distServer)) {
  console.error("ERROR: dist/server not found. Run 'npm run build.server' first.");
  process.exit(1);
}

// ─── Clean previous output ───────────────────────────────────────────────────
if (existsSync(amplifyOut)) {
  rmSync(amplifyOut, { recursive: true, force: true });
  console.log("Cleaned previous .amplify-hosting/ output");
}

// ─── Copy static assets ──────────────────────────────────────────────────────
// dist/client/ → .amplify-hosting/static/
// Amplify serves these directly from its CDN.
mkdirSync(staticOut, { recursive: true });
cpSync(distClient, staticOut, { recursive: true });
console.log("Copied dist/client/ → .amplify-hosting/static/");

// ─── Copy server bundle ───────────────────────────────────────────────────────
// dist/server/ → .amplify-hosting/compute/default/
// This is the Qwik SSR render bundle.
mkdirSync(computeOut, { recursive: true });
cpSync(distServer, computeOut, { recursive: true });
console.log("Copied dist/server/ → .amplify-hosting/compute/default/");

// ─── Verify SSR render bundle ─────────────────────────────────────────────────
// vite build --mode ssr emits dist/server/entry.ssr.js
const ssrBundle = "entry.ssr.js";
if (!existsSync(resolve(computeOut, ssrBundle))) {
  console.error(
    `ERROR: Expected '${ssrBundle}' in dist/server/.\n` +
    `Make sure vite.config.ts has build.ssr = "src/entry.ssr.tsx" when mode === "ssr".`
  );
  process.exit(1);
}

// ─── Write server.js — the Amplify compute entry point ───────────────────────
//
// Amplify starts the compute resource with:  node server.js
// We bundle the Qwik City Node middleware + our server code into a single
// self-contained file using esbuild, so no node_modules need to be copied.
//
import { build as esbuild } from "esbuild";

// Write the unbundled server source first, then bundle it
const serverSrc = `
import { createQwikCity } from "@builder.io/qwik-city/middleware/node";
import render from "./${ssrBundle}";
import { createServer } from "node:http";
const { router, notFound } = createQwikCity({ render });
const port = parseInt(process.env.PORT ?? "3000", 10);
createServer(async (req, res) => {
  await router(req, res, () => { notFound(req, res, () => {}); });
}).listen(port, () => {
  console.log("Qwik City SSR server on http://localhost:" + port);
});
`.trimStart();

const serverSrcPath = resolve(computeOut, "_server-src.mjs");
writeFileSync(serverSrcPath, serverSrc, "utf8");

await esbuild({
  entryPoints: [serverSrcPath],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  outfile: resolve(computeOut, "server.js"),
  // Don't bundle node built-ins or the already-bundled SSR file
  external: ["node:*", `./${ssrBundle}`],
  logLevel: "silent",
});

// Clean up temp source file
import { unlinkSync } from "node:fs";
unlinkSync(serverSrcPath);
console.log("Written .amplify-hosting/compute/default/server.js (bundled)");

// ─── Detect Qwik version for manifest metadata ────────────────────────────────
let qwikVersion = "1.20.0";
try {
  const pkg = JSON.parse(
    readFileSync(resolve(root, "node_modules/@builder.io/qwik/package.json"), "utf8")
  );
  qwikVersion = pkg.version ?? qwikVersion;
} catch {
  // CI runner installs them; local runs may not have node_modules
}

// ─── Write deploy-manifest.json ───────────────────────────────────────────────
//
// Routing rules (evaluated in order, first match wins):
//   /build/*  — Qwik's hashed JS bundles — long cache, static CDN
//   /assets/* — public folder assets — short cache, static CDN
//   /*.*      — any path with a file extension → static, SSR fallback on 404
//   /*        — catch-all → Node.js SSR server
//
const deployManifest = {
  version: 1,
  routes: [
    {
      path: "/build/*",
      target: { kind: "Static", cacheControl: "public, max-age=31536000, immutable" },
    },
    {
      path: "/assets/*",
      target: { kind: "Static", cacheControl: "public, max-age=86400" },
    },
    {
      path: "/*.*",
      target: { kind: "Static" },
      fallback: { kind: "Compute", src: "default" },
    },
    {
      path: "/*",
      target: { kind: "Compute", src: "default" },
    },
  ],
  computeResources: [
    {
      name: "default",
      runtime: "nodejs22.x",
      entrypoint: "server.js",
    },
  ],
  framework: {
    name: "qwik-city",
    version: qwikVersion,
  },
};

writeFileSync(
  resolve(amplifyOut, "deploy-manifest.json"),
  JSON.stringify(deployManifest, null, 2),
  "utf8"
);
console.log("Written .amplify-hosting/deploy-manifest.json");

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log("\n✅ Amplify WEB_COMPUTE build package ready:");
console.log("   Static assets  : .amplify-hosting/static/");
console.log("   SSR compute    : .amplify-hosting/compute/default/server.js");
console.log("   Manifest       : .amplify-hosting/deploy-manifest.json");
