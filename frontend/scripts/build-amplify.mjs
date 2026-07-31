/**
 * build-amplify.mjs
 *
 * Post-build script that reorganises Qwik City's node-server build output
 * into the directory structure required by AWS Amplify Hosting WEB_COMPUTE.
 *
 * AWS Amplify deployment specification:
 *   https://docs.aws.amazon.com/amplify/latest/userguide/ssr-deployment-specification.html
 *
 * Input (produced by Vite builds):
 *   dist/client/   — hashed JS/CSS/assets (from build.client)
 *   dist/server/   — SSR Node.js server bundle (from build.server)
 *
 * Output (consumed by Amplify):
 *   .amplify-hosting/
 *   ├── static/              ← dist/client/* served by CloudFront CDN
 *   ├── compute/
 *   │   └── default/         ← dist/server/* runs as Node.js on port 3000
 *   └── deploy-manifest.json ← routing rules (static vs compute)
 */

import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ─── Paths ────────────────────────────────────────────────────────────────────
const distClient = resolve(root, "dist/client");
const distServer = resolve(root, "dist/server");
const amplifyOut = resolve(root, ".amplify-hosting");
const staticOut  = resolve(amplifyOut, "static");
const computeOut = resolve(amplifyOut, "compute/default");

// ─── Validate build inputs exist ─────────────────────────────────────────────
if (!existsSync(distClient)) {
  console.error(`ERROR: dist/client not found. Run 'npm run build.client' first.`);
  process.exit(1);
}
if (!existsSync(distServer)) {
  console.error(`ERROR: dist/server not found. Run 'npm run build.server' first.`);
  process.exit(1);
}

// ─── Clean previous output ───────────────────────────────────────────────────
if (existsSync(amplifyOut)) {
  rmSync(amplifyOut, { recursive: true, force: true });
  console.log("Cleaned previous .amplify-hosting/ output");
}

// ─── Copy static assets ───────────────────────────────────────────────────────
// All files from dist/client/ go into .amplify-hosting/static/
// Amplify serves these directly from its CDN — no compute involved.
mkdirSync(staticOut, { recursive: true });
cpSync(distClient, staticOut, { recursive: true });
console.log("Copied dist/client/ → .amplify-hosting/static/");

// ─── Copy server bundle ───────────────────────────────────────────────────────
// All files from dist/server/ go into .amplify-hosting/compute/default/
// Amplify starts this with `node entry.node-server.js` on port 3000.
mkdirSync(computeOut, { recursive: true });
cpSync(distServer, computeOut, { recursive: true });
console.log("Copied dist/server/ → .amplify-hosting/compute/default/");

// ─── Determine server entry point ─────────────────────────────────────────────
// Qwik's nodeServerAdapter emits entry.node-server.js in dist/server/
// Verify it exists so we fail loudly here rather than at runtime.
const entryFile = "entry.node-server.js";
if (!existsSync(resolve(computeOut, entryFile))) {
  console.error(
    `ERROR: Expected entry point '${entryFile}' not found in dist/server/.\n` +
    `Check that adapters/node-server/vite.config.ts has input: ["src/entry.node-server.tsx", "@qwik-city-plan"]`
  );
  process.exit(1);
}

// ─── Determine Qwik version for framework metadata ────────────────────────────
let qwikVersion = "1.0.0";
try {
  const pkg = JSON.parse(
    readFileSync(resolve(root, "node_modules/@builder.io/qwik/package.json"), "utf8")
  );
  qwikVersion = pkg.version ?? qwikVersion;
} catch {
  // node_modules not present locally (CI installs them); use fallback
}

// ─── Write deploy-manifest.json ───────────────────────────────────────────────
// Routing rules tell Amplify how to handle each incoming request:
//
//  1. /build/* — Qwik's hashed client bundles. Long cache, served from static CDN.
//  2. /assets/* — public folder assets (images, fonts, icons).
//  3. /*.* — files with extensions (favicon.ico, robots.txt etc). Try static
//             first; fall back to compute so SSR 404 pages still render.
//  4. /* (catch-all) — everything else goes to the Node.js SSR server.
//
// Rule order matters: Amplify matches sequentially and stops at the first hit.
const deployManifest = {
  version: 1,
  routes: [
    // Qwik hashed bundles — immutable, very long cache
    {
      path: "/build/*",
      target: {
        kind: "Static",
        cacheControl: "public, max-age=31536000, immutable",
      },
    },
    // Public folder assets
    {
      path: "/assets/*",
      target: {
        kind: "Static",
        cacheControl: "public, max-age=86400",
      },
    },
    // Any path with a file extension → try static, fall back to SSR
    // (handles favicon.ico, robots.txt, etc. without breaking SSR 404 pages)
    {
      path: "/*.*",
      target: { kind: "Static" },
      fallback: { kind: "Compute", src: "default" },
    },
    // Catch-all → SSR server handles everything else
    {
      path: "/*",
      target: { kind: "Compute", src: "default" },
    },
  ],
  computeResources: [
    {
      name: "default",
      runtime: "nodejs22.x",
      entrypoint: entryFile,
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
console.log("\n✅ Amplify WEB_COMPUTE build package ready at .amplify-hosting/");
console.log("   Static assets : .amplify-hosting/static/");
console.log("   SSR server    : .amplify-hosting/compute/default/");
console.log("   Manifest      : .amplify-hosting/deploy-manifest.json");
